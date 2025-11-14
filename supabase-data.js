// Supabase data loader for products, builder, and prebuilt PCs
// Uses global `window.supabase` from the CDN UMD build

(function () {
  const SUPABASE_URL = 'https://wuxcglaecmmpdtoxgchu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eGNnbGFlY21tcGR0b3hnY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Nzg0MjYsImV4cCI6MjA3NzQ1NDQyNn0.9yPYnqnTmc_aIES9GhwYK2tC5SVgp8D3J-iZYZ7hpvU';

  if (!window.supabase) {
    console.warn('[PCPick] Supabase library not found on window.supabase.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
  const currency = (v) => fmt.format(Number(v || 0));
  const VAT_RATE = 0.12; // 12% VAT used across pages
  const toCents = (n) => Math.round((Number(n) || 0) * 100) / 100;

  const categoryToSectionId = {
    cpu: 'cpu-section',
    gpu: 'gpu-section',
    memory: 'memory-section',
    ram: 'memory-section',
    motherboard: 'motherboard-section',
    storage: 'storage-section',
    psu: 'psu-section',
    case: 'case-section',
    cooler: 'cooler-section',
    prebuilt: 'prebuilt-section',
  };

  const normalizeCategory = (value) => {
    const s = (value || '').toString().trim().toLowerCase();
    if (s === 'cpu') return 'cpu';
    if (s === 'gpu') return 'gpu';
    if (s === 'ram' || s === 'memory') return 'memory';
    if (s === 'motherboard') return 'motherboard';
    if (s === 'storage') return 'storage';
    if (s === 'psu' || s === 'power supply' || s === 'power-supply') return 'psu';
    if (s === 'case' || s === 'chassis') return 'case';
    if (s === 'cooler' || s === 'cooling') return 'cooler';
    if (s === 'prebuilt') return 'prebuilt';
    // Heuristics fallback
    if (/cpu|processor/.test(s)) return 'cpu';
    if (/gpu|graphics/.test(s)) return 'gpu';
    if (/ram|memory/.test(s)) return 'memory';
    if (/mother ?board/.test(s)) return 'motherboard';
    if (/psu|power/.test(s)) return 'psu';
    if (/case|chassis/.test(s)) return 'case';
    if (/cool(ing|er)|aio|fan/.test(s)) return 'cooler';
    if (/pre\s*built/.test(s)) return 'prebuilt';
    return s;
  };

  const safeSpecsList = (product) => {
    const c = [];
    // Show stock if present
    if (typeof product.stock === 'number') c.push(`In stock: ${product.stock}`);
    // Include category for visibility
    if (product.category) c.push(`Category: ${product.category}`);
    return c.slice(0, 3);
  };

  const createCard = (item, opts = {}) => {
    const buttonLabel = opts.buttonLabel || 'Add to Cart';
    const name = item.product_name || item.name || item.title || 'Item';
    const price = Number(item.price || item.unit_price || 0);
    const img = item.image_path || item.image_url || item.image || item.thumbnail || 'assets/placeholder.png';
    const alt = item.image_alt || name;
    const specs = safeSpecsList(item);

    const card = document.createElement('div');
    card.className = 'product-card';
    if (item.uid) card.dataset.uid = item.uid;
    card.innerHTML = `
      <img src="${img}" alt="${alt}">
      <div class="product-info">
        <h3>${name}</h3>
        <ul>${specs.map(s => `<li>${String(s)}</li>`).join('')}</ul>
        <p class="price">${currency(price)}</p>
        <button class="add-cart-btn">${buttonLabel}</button>
      </div>
    `;
    return card;
  };

  // Debounced writer to user_cart
  let persistTimer;
  async function writeUserCart(rows) {
    try {
      const { data: userData, error: userErr } = await client.auth.getUser();
      // broadcast to other tabs immediately via localStorage, regardless of auth
      try {
        localStorage.setItem('pcpick:cart', JSON.stringify({ v: 1, ts: Date.now(), rows: rows || [] }));
      } catch {}

      if (userErr || !userData?.user) return; // not logged in, only local snapshot
      const userId = userData.user.id;
      // Replace current snapshot for this user
      await client.from('user_cart').delete().eq('user_uid', userId);
      if (Array.isArray(rows) && rows.length) {
        const payload = rows.map((r) => {
          const unit = Number(r.price || 0);
          const qty = Math.max(1, Number(r.quantity || 1));
          const gross = toCents(unit * qty * (1 + VAT_RATE)); // unit × qty × (1 + VAT)
          return {
            user_uid: userId,
            product_uid: r.product_uid,
            date_added_to_cart: new Date().toISOString(),
            price: gross,
            quantity: qty,
          };
        });
        const { error } = await client.from('user_cart').insert(payload);
        if (error) console.warn('[PCPick] Failed to insert user_cart:', error.message || error);
      }
    } catch (e) {
      console.warn('[PCPick] Cart persist error:', e?.message || e);
    }
  }

  // Global hook: pages can call this with [{product_uid, price, quantity}]
  window.pcpickPersistCart = function(rows){
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => { writeUserCart(rows); }, 700);
  }

  // Incremental cart operations (no destructive snapshot deletes)
  async function authUserId() {
    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) return null;
      return data.user.id;
    } catch { return null; }
  }

  async function cartSelect(userId, productUid) {
    try {
      const { data } = await client
        .from('user_cart')
        .select('id, quantity, price')
        .eq('user_uid', userId)
        .eq('product_uid', productUid)
        .limit(1)
        .maybeSingle();
      return data || null;
    } catch { return null; }
  }

  // Add-to-cart: create if new, else add quantity to existing row for this product
  async function cartAdd({ product_uid, price, quantity }) {
    const userId = await authUserId();
    if (!userId || !product_uid) return;
    const unit = Number(price || 0);
    const qty = Math.max(1, Number(quantity || 1));
    const existing = await cartSelect(userId, product_uid);
    const newQty = (existing?.quantity || 0) + qty;
    const gross = toCents(unit * newQty * (1 + VAT_RATE));
    if (existing) {
      await client
        .from('user_cart')
        .update({ quantity: newQty, price: gross })
        .eq('user_uid', userId)
        .eq('product_uid', product_uid);
    } else {
      await client
        .from('user_cart')
        .insert({ user_uid: userId, product_uid, quantity: qty, price: toCents(unit * qty * (1 + VAT_RATE)), date_added_to_cart: new Date().toISOString() });
    }
  }

  // Set absolute quantity; delete if 0
  async function cartSet({ product_uid, price, quantity }) {
    const userId = await authUserId();
    if (!userId || !product_uid) return;
    const unit = Number(price || 0);
    const qty = Math.max(0, Number(quantity || 0));
    if (qty <= 0) {
      await client.from('user_cart')
        .delete()
        .eq('user_uid', userId)
        .eq('product_uid', product_uid);
      return;
    }
    const gross = toCents(unit * qty * (1 + VAT_RATE));
    const existing = await cartSelect(userId, product_uid);
    if (existing) {
      await client
        .from('user_cart')
        .update({ quantity: qty, price: gross })
        .eq('user_uid', userId)
        .eq('product_uid', product_uid);
    } else {
      await client
        .from('user_cart')
        .insert({ user_uid: userId, product_uid, quantity: qty, price: gross, date_added_to_cart: new Date().toISOString() });
    }
  }

  window.pcpickCartAdd = cartAdd;
  window.pcpickCartSet = cartSet;

  // Load user's cart snapshot and broadcast to pages
  async function getUserCartSnapshot() {
    try {
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr || !userData?.user) return [];
      const userId = userData.user.id;
      // Try view first
      let rows = [];
      try {
        const { data, error } = await client
          .from('v_user_cart')
          .select('product_uid, product_name, price, quantity')
          .eq('user_uid', userId);
        if (!error && Array.isArray(data)) rows = data;
      } catch { /* ignore */ }
      if (!rows.length) {
        const { data: base, error } = await client
          .from('user_cart')
          .select('product_uid, price, quantity')
          .eq('user_uid', userId);
        if (error || !Array.isArray(base)) return [];
        rows = base;
      }
      const ids = rows.map(r => r.product_uid).filter(Boolean);
      const { data: products } = ids.length ? await client
        .from('products')
        .select('uid, product_name, price')
        .in('uid', ids) : { data: [] };
      const byId = Object.fromEntries((products || []).map(p => [p.uid, p]));
      return rows.map(r => {
        const total = Number(r.price || 0);
        const qty = Math.max(1, Number(r.quantity || 1));
        const unitGross = total / qty;
        const unitNet = unitGross / (1 + VAT_RATE); // convert from VAT-inclusive to net unit
        return {
          uid: r.product_uid,
          name: r.product_name || byId[r.product_uid]?.product_name || 'Item',
          price: Number.isFinite(unitNet) ? unitNet : (byId[r.product_uid]?.price ?? 0),
          quantity: Math.max(0, Number(r.quantity || 0))
        };
      });
    } catch { return []; }
  }

  window.pcpickGetCartSnapshot = getUserCartSnapshot;

  // Load user's build snapshot (v_user_build preferred), return [{ uid, name, category, price, quantity }]
  async function getUserBuildSnapshot() {
    try {
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr || !userData?.user) return [];
      const userId = userData.user.id;
      let rows = [];
      try {
        const { data, error } = await client
          .from('v_user_build')
          .select('product_uid, product_name, category, item_price, build_price')
          .eq('user_uid', userId);
        if (!error && Array.isArray(data)) rows = data;
      } catch {}
      if (!rows.length) {
        const { data: base } = await client
          .from('user_build')
          .select('product_uid, item_price, build_price')
          .eq('user_uid', userId);
        rows = base || [];
      }
      const ids = rows.map(r => r.product_uid).filter(Boolean);
      const { data: products } = ids.length ? await client
        .from('products')
        .select('uid, product_name, price, category')
        .in('uid', ids) : { data: [] };
      const byId = Object.fromEntries((products || []).map(p => [p.uid, p]));
      return rows.map(r => {
        const unitGross = Number(r.item_price || 0);
        const unitNet = unitGross / (1 + VAT_RATE);
        const p = byId[r.product_uid] || {};
        return {
          uid: r.product_uid,
          name: r.product_name || p.product_name || 'Item',
          category: r.category || p.category || '',
          price: Number.isFinite(unitNet) ? unitNet : (p.price ?? 0),
          quantity: 1,
        };
      });
    } catch { return []; }
  }

  window.pcpickGetBuildSnapshot = getUserBuildSnapshot;

  // Build table helpers (user_build)
  async function buildSelect(userId, productUid) {
    try {
      const { data } = await client
        .from('user_build')
        .select('product_uid, item_price, build_price')
        .eq('user_uid', userId)
        .eq('product_uid', productUid)
        .limit(1)
        .maybeSingle();
      return data || null;
    } catch { return null; }
  }

  // Recompute and update build_price (total) for all rows of this user
  async function recomputeBuildTotal(userId) {
    try {
      const { data: rows } = await client
        .from('user_build')
        .select('item_price')
        .eq('user_uid', userId);
      const total = (rows || []).reduce((s, r) => s + Number(r.item_price || 0), 0);
      await client
        .from('user_build')
        .update({ build_price: toCents(total) })
        .eq('user_uid', userId);
    } catch {}
  }

  async function buildInsert({ product_uid, price }) {
    const userId = await authUserId();
    if (!userId || !product_uid) return;
    const unit = Number(price || 0);
    const gross = toCents(unit * (1 + VAT_RATE)); // item_price (VAT-inclusive per item)
    const exists = await buildSelect(userId, product_uid);
    if (exists) {
      await client
        .from('user_build')
        .update({ item_price: gross })
        .eq('user_uid', userId)
        .eq('product_uid', product_uid);
      await recomputeBuildTotal(userId);
      return;
    }
    await client
      .from('user_build')
      .insert({ user_uid: userId, product_uid, created_at: new Date().toISOString(), item_price: gross });
    await recomputeBuildTotal(userId);
  }

  async function buildDelete({ product_uid }) {
    const userId = await authUserId();
    if (!userId || !product_uid) return;
    await client
      .from('user_build')
      .delete()
      .eq('user_uid', userId)
      .eq('product_uid', product_uid);
    await recomputeBuildTotal(userId);
  }

  // Replace previous selection (if any) with a new one for a category
  async function buildReplace({ prev_uid, new_uid, price }) {
    try {
      if (prev_uid && prev_uid !== new_uid) await buildDelete({ product_uid: prev_uid });
      if (new_uid) await buildInsert({ product_uid: new_uid, price });
    } catch {}
  }

  window.pcpickBuildInsert = buildInsert;
  window.pcpickBuildDelete = buildDelete;
  window.pcpickBuildReplace = buildReplace;

  async function fetchTable(table) {
    try {
      const { data, error } = await client.from(table).select('*');
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`[PCPick] Failed to fetch ${table}:`, err?.message || err);
      return [];
    }
  }

  function clearIfAny(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  async function populateProducts(scopeSelector, buttonLabel) {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const items = await fetchTable('products');
    if (!items.length) return;

    // Group by normalized category
    const byCategory = {};
    for (const it of items) {
      const key = normalizeCategory(it.category || it.type);
      if (key === 'prebuilt') continue; // exclude Prebuilt from generic products/builder pages
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(it);
    }

    // Clear all known sections first
    Object.values(categoryToSectionId).forEach((sectionId) => {
      const section = scope.querySelector(`#${sectionId}.product-grid`);
      if (section) clearIfAny(section);
    });

    // Append items to their corresponding sections; if unknown, drop into first grid in scope
    const defaultGrid = scope.querySelector('.product-grid');
    items.forEach((it) => {
      const key = normalizeCategory(it.category);
      if (key === 'prebuilt') return; // don't place Prebuilt items in component tabs
      const sectionId = categoryToSectionId[key];
      const section = sectionId ? scope.querySelector(`#${sectionId}.product-grid`) : null;
      (section || defaultGrid)?.appendChild(createCard(it, { buttonLabel }));
    });
  }

  async function populateAllProducts(scopeSelector, buttonLabel) {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const items = await fetchTable("products");
    if (!items.length) return;

    // Group by normalized category
    const byCategory = {};
    for (const it of items) {
      const key = normalizeCategory(it.category || it.type);
      if (key === 'prebuilt') continue; // exclude Prebuilt from generic products/builder pages
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(it);
    }

    // Clear all known sections first
    Object.values(categoryToSectionId).forEach((sectionId) => {
      const allSection = scope.querySelector('#all-section .product-grid');
      if (allSection) clearIfAny(allSection);
    });

    // Append items to their corresponding sections; if unknown, drop into first grid in scope
    const defaultGrid = scope.querySelector('.product-grid');
    items.forEach((it) => {
      const key = normalizeCategory(it.category);
      if (key === 'prebuilt') return; // don't place Prebuilt items in component tabs
      const sectionId = categoryToSectionId[key];
      const section = sectionId ? scope.querySelector(`#all-section.product-grid`) : null;
      (section || defaultGrid)?.appendChild(createCard(it, { buttonLabel }));
    });
  }

  // Note: Prebuilt PCs page also uses the same `products` table so we reuse populateProducts
  async function populatePrebuilt(scopeSelector) {
    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const items = await fetchTable('products');
    const list = items.filter((it) => normalizeCategory(it.category) === 'prebuilt');
    // Prefer first grid under scope; hide others to avoid duplicate layouts
    const grids = scope.querySelectorAll('.product-grid');
    if (!grids.length) return;
    const target = grids[0];
    clearIfAny(target);
    grids.forEach((g, i) => { if (i > 0) g.style.display = 'none'; });
    list.forEach((pc) => target.appendChild(createCard(pc, { buttonLabel: 'Add to Cart' })));
  }

  // Auto-run on DOM ready
  const run = async () => {
    // Products page
      if (document.querySelector('.products')) {
      await populateProducts('.products', 'Add to Cart');
      await populateAllProducts('.products', 'Add to Cart');
      document.dispatchEvent(new CustomEvent('pcpick:products-populated'));
    }
    // PC Builder: same products table, different button label
    if (document.querySelector('.pcbuilder')) {
      await populateProducts('.pcbuilder', 'Select');
      await populateAllProducts('.pcbuilder', 'Add to Cart');
      document.dispatchEvent(new CustomEvent('pcpick:builder-populated'));
    }
    // Prebuilt PCs (only items whose category is Prebuilt)
    if (document.querySelector('.prebuiltpcs')) {
      await populatePrebuilt('.prebuiltpcs');
      document.dispatchEvent(new CustomEvent('pcpick:prebuilt-populated'));
    }

    // Emit cart snapshot once on load for any page to consume
    try {
      const rows = await getUserCartSnapshot();
      document.dispatchEvent(new CustomEvent('pcpick:cart-snapshot', { detail: { rows } }));
    } catch {}

    // Emit build snapshot as well
    try {
      const buildRows = await getUserBuildSnapshot();
      document.dispatchEvent(new CustomEvent('pcpick:build-snapshot', { detail: { rows: buildRows } }));
    } catch {}
  };

  let invoked = false;
  const runOnce = () => { if (!invoked) { invoked = true; try { run(); } catch (e) { console.warn('[PCPick] loader error:', e); } } };
  // Try immediately (since this script is placed before inline initializers)
  runOnce();
  // And also ensure after DOMContentLoaded just in case
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOnce);
  }
})();

// Publishes cart rows to checkout.html
async function loadUserCartForCheckout() {
  const rows = await getUserCartSnapshot();

  document.dispatchEvent(new CustomEvent("pcpick:checkout-cart", {
    detail: { rows }
  }));
}

window.pcpickLoadUserCartForCheckout = loadUserCartForCheckout;