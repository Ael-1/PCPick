(function(){
  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  let open = false;
  if(menuToggle){
    menuToggle.addEventListener('click', ()=>{
      open = !open;
      if(open){
        nav.style.display = 'block';
        menuToggle.setAttribute('aria-expanded','true');
      } else {
        nav.style.display = '';
        menuToggle.setAttribute('aria-expanded','false');
      }
    });
  }

  // Inject current year in footer
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Simple prefers-reduced-motion respect for animated things (placeholder)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    document.documentElement.classList.add('reduced-motion');
  }
})();

// Scroll to Products section when clicking the Products link
const productsLink = document.querySelector('.nav a[href="#products"]');
if (productsLink) {
  productsLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
}


