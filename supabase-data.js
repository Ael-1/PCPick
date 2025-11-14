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

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
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

  // Global promise to track the last cart operation, preventing race conditions on checkout.
  window.pcpickLastCartPromise = null;

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
    const operation = async () => {
      const userId = await authUserId();
      if (!userId || !product_uid || !quantity || quantity <= 0) return;
      if (!userId || !product_uid) return;
      const unitNetPrice = Number(price || 0); // This is the base price from the 'products' table
      const qtyToAdd = Math.max(1, Number(quantity || 1));
      const existing = await cartSelect(userId, product_uid);
      const newQty = (existing?.quantity || 0) + qtyToAdd;
      const newTotalGross = toCents(unitNetPrice * newQty * (1 + VAT_RATE));
      if (existing) {
        await client
          .from('user_cart')
          .update({ quantity: newQty, price: newTotalGross })
          .eq('user_uid', userId)
          .eq('product_uid', product_uid);
      } else {
        const initialGross = toCents(unitNetPrice * qtyToAdd * (1 + VAT_RATE));
        await client
          .from('user_cart')
          .insert({ user_uid: userId, product_uid, quantity: qtyToAdd, price: initialGross, date_added_to_cart: new Date().toISOString() });
      }
    };
    window.pcpickLastCartPromise = operation();
    const promise = window.pcpickLastCartPromise;
    // After the operation completes, fetch the new cart state and notify the UI
    promise.then(async () => {
      const rows = await getUserCartSnapshot();
      document.dispatchEvent(new CustomEvent('pcpick:cart-snapshot', { detail: { rows } }));
    });
    return promise;
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
    } else {
      const gross = toCents(unit * qty * (1 + VAT_RATE));
      const existing = await cartSelect(userId, product_uid);
      if (existing) {
        await client
          .from('user_cart')
          .update({ quantity: qty, price: gross })
          .eq('user_uid', userId)
          .eq('product_uid', product_uid);
      } else if (qty > 0) {
        // Only insert if it doesn't exist and quantity is positive
        await client
          .from('user_cart')
          .insert({ user_uid: userId, product_uid, quantity: qty, price: gross, date_added_to_cart: new Date().toISOString() });
      }
      // After updating, fetch the new cart state and notify the UI
      const rows = await getUserCartSnapshot();
      document.dispatchEvent(new CustomEvent('pcpick:cart-snapshot', { detail: { rows } }));
    }
    // After setting, fetch the new cart state and notify the UI
    const rows = await getUserCartSnapshot();
    document.dispatchEvent(new CustomEvent('pcpick:cart-snapshot', { detail: { rows } }));
  }

  window.pcpickCartAdd = cartAdd;
  window.pcpickCartSet = cartSet;

    // Load user's cart snapshot and broadcast to pages
  async function getUserCartSnapshot() {
    try {
      const userId = await authUserId();
      if (!userId) return [];

      // 1. Fetch all cart items for the user
      const { data: cartItems, error: cartError } = await client
        .from('user_cart')
        .select('product_uid, quantity')
        .eq('user_uid', userId);

      if (cartError || !cartItems || cartItems.length === 0) {
        return [];
      }

      // 2. Get all product details for the items in the cart
      const productIds = cartItems.map(item => item.product_uid);
      const { data: products, error: productsError } = await client
        .from('products')
        .select('uid, product_name, price')
        .in('uid', productIds);

      if (productsError) {
        return [];
      }

      // 3. Combine the data into a clean list for the checkout page
      const productsById = Object.fromEntries(products.map(p => [p.uid, p]));

      return cartItems.map(cartItem => {
        const product = productsById[cartItem.product_uid] || {};
        return {
          uid: cartItem.product_uid,
          name: product.product_name || 'Unknown Item',
          price: Number(product.price || 0), // This is the net unit price
          quantity: Number(cartItem.quantity || 1),
        };
      });
    } catch {
      return []; // Return an empty array on any error
    }
  }


  window.pcpickGetCartSnapshot = getUserCartSnapshot;

  // Load user's build snapshot (v_user_build preferred), return [{ uid, name, category, price, quantity }]
  async function getUserBuildSnapshot() {
    try {
      const userId = await authUserId();
      if (!userId) return [];

      // 1. Fetch all items from the user's build
      const { data: buildItems, error: buildError } = await client
        .from('user_build')
        .select('product_uid, item_price')
        .eq('user_uid', userId);

      if (buildError || !buildItems || buildItems.length === 0) return [];

      // 2. Get product details for all items in the build
      const productIds = buildItems.map(item => item.product_uid).filter(Boolean);
      const { data: products, error: productsError } = productIds.length ? await client
        .from('products')
        .select('uid, product_name, price, category')
        .in('uid', productIds) : { data: [] };

      if (productsError) return [];

      const productsById = Object.fromEntries((products || []).map(p => [p.uid, p]));

      return buildItems.map(item => {
        const product = productsById[item.product_uid] || {};
        return {
          uid: item.product_uid,
          name: product.product_name || 'Unknown Item',
          category: product.category || '',
          price: Number(product.price || 0), // Use the net price from the products table
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
      return total;
    } catch {}
    return 0;
  }

  async function buildInsert({ product_uid, price }) {
    const userId = await authUserId();
    if (!userId || !product_uid) return;
    const unit = Number(price || 0);
    const gross = toCents(unit * (1 + VAT_RATE));
    const exists = await buildSelect(userId, product_uid);
    if (exists) {
      await client
        .from('user_build')
        .update({ item_price: gross })
        .eq('user_uid', userId)
        .eq('product_uid', product_uid);
    }
    else {
      await client
        .from('user_build')
        .insert({ user_uid: userId, product_uid, created_at: new Date().toISOString(), item_price: gross });
    }
    await recomputeBuildTotal(userId);
    const buildRows = await getUserBuildSnapshot();
    document.dispatchEvent(new CustomEvent('pcpick:build-snapshot', { detail: { rows: buildRows } }));
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
    const buildRows = await getUserBuildSnapshot();
    document.dispatchEvent(new CustomEvent('pcpick:build-snapshot', { detail: { rows: buildRows } }));
  }

  // Replace previous selection (if any) with a new one for a category
  async function buildReplace({ prev_uid, new_uid, price }) {
    try {
      if (prev_uid && prev_uid !== new_uid) await buildDelete({ product_uid: prev_uid });
      if (new_uid) await buildInsert({ product_uid: new_uid, price });
      // If only deleting, the event is fired in buildDelete. If inserting/replacing,
      // the event is fired in buildInsert, so no extra dispatch is needed here.
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
      document.dispatchEvent(new CustomEvent('pcpick:products-populated'));
    }
    // PC Builder: same products table, different button label
    if (document.querySelector('.pcbuilder')) {
      await populateProducts('.pcbuilder', 'Select');
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
(function() {
  async function loadUserCartForCheckout() {
    const rows = await window.pcpickGetCartSnapshot();
  
    document.dispatchEvent(new CustomEvent("pcpick:checkout-cart", {
      detail: { rows }
    }));
  }
  
  window.pcpickLoadUserCartForCheckout = loadUserCartForCheckout;

  /**
   * Takes all items from the user's current build (`user_build` table) and
   * adds them to the main shopping cart (`user_cart` table).
   */
  async function addBuildToCart() {
    const buildItems = await getUserBuildSnapshot();
    if (!buildItems || buildItems.length === 0) {
      console.warn("[PCPick] Build is empty, nothing to add to cart.");
      return;
    }

    // Create a promise for each item being added to the cart
    const addPromises = buildItems.map(item => {
      return cartAdd({
        product_uid: item.uid,
        price: item.price, // This is the net unit price from getUserBuildSnapshot
        quantity: 1,       // Each component in a build has a quantity of 1
      });
    });

    // Wait for all items to be added before proceeding
    await Promise.all(addPromises);
  }
  window.pcpickAddBuildToCart = addBuildToCart;

})();
