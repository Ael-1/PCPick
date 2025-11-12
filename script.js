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

(function () {
  // Find buttons/links whose visible text includes "checkout" (case-insensitive)
  const candidates = Array.from(document.querySelectorAll('a,button'))
    .filter(el => el.textContent && /checkout/i.test(el.textContent.trim()));

  if (candidates.length === 0) return;

  candidates.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // prevent default form submission or link navigation so we can route to checkout page
      e.preventDefault();
      // navigate to checkout page
      window.location.href = 'checkout.html';
    });
  });
})();


