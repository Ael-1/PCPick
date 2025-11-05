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
  const cpuBtn = document.getElementById('cpu-btn');
  const gpuBtn = document.getElementById('gpu-btn');
  const cpuSection = document.getElementById('cpus');
  const gpuSection = document.getElementById('graphics');

  if (!cpuBtn || !gpuBtn || !cpuSection || !gpuSection) return;

  cpuBtn.addEventListener('click', () => {
    cpuSection.style.display = 'grid';
    gpuSection.style.display = 'none';
    cpuBtn.classList.add('active');
    gpuBtn.classList.remove('active');
  });

  gpuBtn.addEventListener('click', () => {
    gpuSection.style.display = 'grid';
    cpuSection.style.display = 'none';
    gpuBtn.classList.add('active');
    cpuBtn.classList.remove('active');
  });
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
