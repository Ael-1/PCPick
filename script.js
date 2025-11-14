(() => {
  const body = document.body;
  const menuToggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('drawer-close');
  const focusableSelector = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocusedElement = null;

  if (!drawer || !overlay) return;

  menuToggle?.setAttribute('aria-expanded', 'false');

  const trapFocus = (event) => {
    if (!drawer.classList.contains('open') || event.key !== 'Tab') return;
    const focusableItems = drawer.querySelectorAll(focusableSelector);
    if (!focusableItems.length) return;

    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  };

  const openDrawer = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    overlay.classList.add('visible');
    body.classList.add('drawer-open');
    menuToggle?.setAttribute('aria-expanded', 'true');
    lastFocusedElement = document.activeElement;
    const focusableItems = drawer.querySelectorAll(focusableSelector);
    focusableItems[0]?.focus();
  };

  const closeDrawer = (returnFocus = true) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        overlay.hidden = true;
      }
    }, 300);
    body.classList.remove('drawer-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (returnFocus) lastFocusedElement?.focus();
  };

  const handleToggle = () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  menuToggle?.addEventListener('click', handleToggle);
  closeBtn?.addEventListener('click', () => closeDrawer());
  overlay.addEventListener('click', () => closeDrawer());
  drawer.addEventListener('keydown', trapFocus);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && drawer.classList.contains('open')) {
      closeDrawer(false);
    }
  });
})();

(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced-motion');
  }
})();

(() => {
  const productsLink = document.querySelector('.nav a[href="#products"]');
  if (productsLink) {
    productsLink.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();

(() => {
  const setupCatalogTabs = (scopeSelector) => {
    document.querySelectorAll(scopeSelector).forEach((scope) => {
      const tabs = scope.querySelectorAll(".product-tabs .tab");
      const sections = scope.querySelectorAll(".product-grid");
      if (!tabs.length || !sections.length) return;

      const showSection = (targetId) => {
        sections.forEach((section) => {
          section.classList.toggle("is-active", section.id === targetId);
        });
      };

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((btn) => btn.classList.remove("active"));
          tab.classList.add("active");
          showSection(tab.dataset.cat);
        });
      });

      showSection(tabs[0]?.dataset.cat ?? sections[0]?.id);
    });
  };

  setupCatalogTabs(".products");
  setupCatalogTabs(".pcbuilder");
})();


let slideIndex = 0;
let slideIntervalId;

const showSlides = () => {
  const slides = document.getElementsByClassName('mySlides');
  if (!slides.length) return;

  if (slideIndex >= slides.length) slideIndex = 0;
  if (slideIndex < 0) slideIndex = slides.length - 1;

  for (let i = 0; i < slides.length; i += 1) {
    slides[i].style.display = 'none';
  }

  slides[slideIndex].style.display = 'block';
};

const resetSlideInterval = () => {
  if (slideIntervalId) clearInterval(slideIntervalId);
  slideIntervalId = setInterval(() => {
    window.plusSlides(1);
  }, 5000);
};

window.plusSlides = (n) => {
  slideIndex += n;
  showSlides();
  resetSlideInterval();
};

window.addEventListener('load', () => {
  showSlides();
  resetSlideInterval();
});

(function () {
  const themeSwitch = document.getElementById('theme-switch');
  const applyTheme = (isDark) => {
    document.body.classList.toggle('dark-mode', isDark);
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const saved = localStorage.getItem('theme') === 'dark';
  applyTheme(saved);
  if (themeSwitch) {
    themeSwitch.checked = saved;
  }

  themeSwitch?.addEventListener('change', () => {
    const isDark = themeSwitch.checked;
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
})();

(() => {
  const toggles = document.querySelectorAll('.password-toggle[data-password-toggle]');
  if (!toggles.length) return;

  const updateIcon = (btn, input, icons) => {
    const img = btn.querySelector('img');
    if (!img) return;
    if (input.type === 'password') {
      img.src = icons.hidden;
      btn.setAttribute('aria-label', 'Show password');
    } else {
      img.src = icons.visible;
      btn.setAttribute('aria-label', 'Hide password');
    }
  };

  toggles.forEach((btn) => {
    const selector = btn.getAttribute('data-password-toggle');
    const input = selector ? document.querySelector(selector) : null;
    if (!input) return;

    const icons = {
      visible: btn.dataset.visibleIcon || 'assets/visible.png',
      hidden: btn.dataset.hiddenIcon || 'assets/hidden.png',
    };

    btn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      updateIcon(btn, input, icons);
    });

    const updateThemeClass = () => {
      const isDark = document.body.classList.contains('dark-mode');
      btn.closest('.password-field')?.classList.toggle('dark', isDark);
      btn.closest('.password-field')?.classList.toggle('light', !isDark);
    };

    updateThemeClass();
    const observer = new MutationObserver(updateThemeClass);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    updateIcon(btn, input, icons);
  });
})();

// Note: Supabase cart writes are handled in supabase-data.js (pcpickPersistCart).
// We removed a duplicate mirroring block here that could erase server rows on refresh.

(function () {
  // Find buttons/links whose visible text includes "checkout" (case-insensitive)
  const candidates = Array.from(document.querySelectorAll('a,button'))
    .filter(el => el.textContent && /checkout/i.test(el.textContent.trim()));

  if (candidates.length === 0) return;

  const REF = 'wuxcglaecmmpdtoxgchu';
  const STORAGE_KEY = `sb-${REF}-auth-token`;
  const isLoggedIn = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const candidates = [parsed?.currentSession, parsed?.session, parsed?.data?.session, parsed];
      const session = candidates.find((s) => s && s.access_token && s.user);
      return Boolean(session && session.user && session.access_token);
    } catch { return false; }
  };

  candidates.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // prevent default form submission or link navigation so we can route to checkout page
      e.preventDefault();
      // navigate: if not logged in, go to login first
      if (!isLoggedIn()) {
        window.location.href = 'login.html';
      } else {
        window.location.href = 'checkout.html';
      }
    });
  });
})();



// Auth-aware nav toggling: hide login/signup and show user badge when logged in
(function () {
  const REF = 'wuxcglaecmmpdtoxgchu';
  const SUPABASE_URL = 'https://wuxcglaecmmpdtoxgchu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eGNnbGFlY21tcGR0b3hnY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Nzg0MjYsImV4cCI6MjA3NzQ1NDQyNn0.9yPYnqnTmc_aIES9GhwYK2tC5SVgp8D3J-iZYZ7hpvU';
  const STORAGE_KEY = `sb-${REF}-auth-token`;

  const parseSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const candidates = [
        parsed?.currentSession,
        parsed?.session,
        parsed?.data?.session,
        parsed,
      ];
      return candidates.find((entry) => entry && typeof entry === 'object' && entry.access_token) || null;
    } catch {
      return null;
    }
  };

  const getDisplay = (user) => {
    if (!user) return { name: null, initials: '?' };
    const name = user.user_metadata?.full_name || user.email || 'Account';
    const initials = (name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || (user.email ? user.email[0].toUpperCase() : '?');
    return { name, initials };
  };

  const createUserBadge = ({ name, initials }) => {
    const wrap = document.createElement('div');
    wrap.className = 'user-badge';
    wrap.dataset.authVisible = 'signed-in';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'user-badge__toggle';
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');

    const avatar = document.createElement('div');
    avatar.className = 'user-badge__avatar';
    avatar.textContent = initials;

    const caret = document.createElement('span');
    caret.className = 'user-badge__caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '▾';

    toggle.appendChild(avatar);
    toggle.appendChild(caret);

    const menu = document.createElement('div');
    menu.className = 'user-badge__menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    const header = document.createElement('div');
    header.className = 'user-badge__menu-header';
    const nameEl = document.createElement('div');
    nameEl.className = 'user-badge__name';
    nameEl.textContent = name || 'Account';
    header.appendChild(nameEl);

    const list = document.createElement('div');
    list.className = 'user-badge__menu-list';

    const createMenuButton = (label, action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'user-badge__menu-item';
      btn.textContent = label;
      btn.dataset.menuAction = action;
      btn.setAttribute('role', 'menuitem');
      return btn;
    };

    const ordersBtn = createMenuButton('Orders', 'orders');
    const accountBtn = createMenuButton('Account Settings', 'account');
    const logoutBtn = createMenuButton('Log Out', 'logout');
    logoutBtn.setAttribute('data-temp-logout', '');

    list.appendChild(ordersBtn);
    list.appendChild(accountBtn);
    list.appendChild(logoutBtn);

    menu.appendChild(header);
    menu.appendChild(list);

    wrap.appendChild(toggle);
    wrap.appendChild(menu);
    return wrap;
  };

  const userBadgeRegistry = new Set();

  const closeUserMenu = (badge) => {
    if (!badge) return;
    badge.classList.remove('is-open');
    const toggle = badge.querySelector('.user-badge__toggle');
    const menu = badge.querySelector('.user-badge__menu');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  };

  const closeAllUserMenus = () => {
    userBadgeRegistry.forEach((badge) => closeUserMenu(badge));
  };

  const attachUserBadgeMenu = (badge) => {
    if (!badge || badge.dataset.userMenuBound === 'true') return;
    const toggle = badge.querySelector('.user-badge__toggle');
    const menu = badge.querySelector('.user-badge__menu');
    if (!toggle || !menu) return;

    badge.dataset.userMenuBound = 'true';
    userBadgeRegistry.add(badge);

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !badge.classList.contains('is-open');
      closeAllUserMenus();
      if (willOpen) {
        badge.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
        menu.querySelector('.user-badge__menu-item')?.focus();
      } else {
        closeUserMenu(badge);
      }
    });

    badge.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && badge.classList.contains('is-open')) {
        event.stopPropagation();
        closeUserMenu(badge);
        toggle.focus();
      }
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('.user-badge__menu-item')) {
        closeUserMenu(badge);
      }
    });
  };

  document.addEventListener('click', (event) => {
    userBadgeRegistry.forEach((badge) => {
      if (!badge.contains(event.target)) {
        closeUserMenu(badge);
      }
    });
  });

  const setHiddenState = (el, hidden) => {
    if (!el) return;
    el.hidden = hidden;
    if (hidden) {
      el.style.setProperty('display', 'none', 'important');
    } else {
      el.style.removeProperty('display');
    }
    if (hidden) {
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('aria-hidden');
    }
  };

  const updateAuthVisibility = (isLoggedIn) => {
    const showSignedIn = Boolean(isLoggedIn);
    document.querySelectorAll('[data-auth-visible="signed-in"]').forEach((el) => {
      setHiddenState(el, !showSignedIn);
    });
    document.querySelectorAll('[data-auth-visible="signed-out"]').forEach((el) => {
      setHiddenState(el, showSignedIn);
    });
  };

  const applyState = () => {
    const session = parseSession();
    const user = session?.user || null;
    const navActions = document.querySelector('.nav-actions');
    const drawerActions = document.querySelector('.drawer-actions');

    const ensureBadge = (root) => {
      if (!root) return;
      let badge = root.querySelector('.user-badge');
      if (!badge) {
        const info = getDisplay(user);
        badge = createUserBadge(info);
        // insert before menu-toggle if present, else append
        const before = root.querySelector('.theme-toggle') || root.querySelector('#menu-toggle');
        if (before) root.insertBefore(badge, before); else root.appendChild(badge);
        attachUserBadgeMenu(badge);
      } else if (user) {
        // If badge exists, ensure drawer version has the name element
        const isDrawer = root.classList.contains('drawer-actions');
        const toggle = badge.querySelector('.user-badge__toggle');
        let nameSpan = toggle?.querySelector('.user-badge__drawer-name');
        if (isDrawer && !nameSpan) {
          addNameToDrawerBadge(badge, getDisplay(user).name);
        }

        const info = getDisplay(user);
        const nameTarget = badge.querySelector('.user-badge__name');
        const avatar = badge.querySelector('.user-badge__avatar');
        if (nameTarget) nameTarget.textContent = info.name;
        if (avatar) avatar.textContent = info.initials;
      }
      badge.style.display = 'inline-flex';

      // Special handling for drawer: add user name to the toggle button
      if (root.classList.contains('drawer-actions')) {
        const info = getDisplay(user);
        addNameToDrawerBadge(badge, info.name);
      }
    };

    if (user) {
      ensureBadge(navActions);
      ensureBadge(drawerActions);
    }

    updateAuthVisibility(Boolean(user));
    if (!user) {
      closeAllUserMenus();
    }
    wireTemporaryLogout();
  };

  const addNameToDrawerBadge = (badge, name) => {
    if (!badge || !name) return;
    const toggle = badge.querySelector('.user-badge__toggle');
    if (!toggle) return;
    // Avoid adding it twice
    if (toggle.querySelector('.user-badge__drawer-name')) return;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-badge__drawer-name';
    nameSpan.textContent = name;
    // Insert name between avatar and caret
    toggle.insertBefore(nameSpan, toggle.querySelector('.user-badge__caret'));
  };

  const performSupabaseLogout = async (session) => {
    const accessToken = session?.access_token;
    if (!accessToken) return;
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // ignore network issues; removing local session is enough for UI
    }
  };

  const handleTempLogoutClick = async (btn) => {
    const session = parseSession();
    btn?.setAttribute('aria-busy', 'true');
    localStorage.removeItem(STORAGE_KEY);
    await performSupabaseLogout(session);
    window.location.href = 'index.html';
  };

  const wireTemporaryLogout = () => {
    document.querySelectorAll('[data-temp-logout]').forEach((btn) => {
      if (btn.dataset.logoutBound === 'true') return;
      btn.dataset.logoutBound = 'true';
      btn.addEventListener('click', () => handleTempLogoutClick(btn));
    });
  };

  // Apply on load
  try { applyState(); } catch {}

  // Also observe localStorage changes (e.g., login from another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      applyState();
    }
  });
})();
