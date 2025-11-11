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

(() => {
  const themeSwitch = document.getElementById('theme-switch');
  if (!themeSwitch) return;

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeSwitch.checked = true;
  }

  const toggle = document.querySelector('.theme-toggle input');
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    });
    
  // Toggle theme on switch
  themeSwitch.addEventListener('change', () => {
    const isDark = themeSwitch.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
})();

