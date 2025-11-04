(function(){
  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  let open = false;
  if(menuToggle){
    menuToggle.addEventListener('click', ()=> {
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

// Graphics card button
document.addEventListener("DOMContentLoaded", () => {
  const cpuBtn = document.getElementById("cpu-btn");
  const gpuBtn = document.getElementById("gpu-btn");
  const cpuSection = document.getElementById("cpus");
  const gpuSection = document.getElementById("graphics");

  cpuBtn.addEventListener("click", () => {
    cpuSection.style.display = "grid";
    gpuSection.style.display = "none";
    cpuBtn.classList.add("active");
    gpuBtn.classList.remove("active");
  });

  gpuBtn.addEventListener("click", () => {
    gpuSection.style.display = "grid";
    cpuSection.style.display = "none";
    gpuBtn.classList.add("active");
    cpuBtn.classList.remove("active");
  });
});

let slideIndex = 0;
showSlides(); // Call showSlides to hide all slides initially
let slideInterval = setInterval(() => {
  plusSlides(1);
}, 5000);

function plusSlides(n) {
  slideIndex += n;
  showSlides();
  resetSlideInterval(); // Reset the interval when an arrow is clicked
}

function showSlides() {
  let i;
  const slides = document.getElementsByClassName("mySlides");
  if (slideIndex >= slides.length) { slideIndex = 0; }
  if (slideIndex < 0) { slideIndex = slides.length - 1; }
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  
  slides[slideIndex].style.display = "block";  
}

function resetSlideInterval() {
  clearInterval(slideInterval); // Clear the existing interval
  slideInterval = setInterval(() => {
    plusSlides(1);
  }, 5000); // Restart the interval
}


