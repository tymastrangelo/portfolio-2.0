// Elements to load dynamically
const sectionsToLoad = {
  "nav-container": "nav.html",
  "footer-container": "footer.html"
};

// Track load completion
let loadedCount = 0;
const totalToLoad = Object.keys(sectionsToLoad).length;

// Load nav and footer
for (const [id, file] of Object.entries(sectionsToLoad)) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
      loadedCount++;
      if (loadedCount === totalToLoad) {
        initSiteFeatures(); // Only after both nav and footer are loaded
      }
    });
}

// Initialize features after nav & footer are injected
function initSiteFeatures() {
  setupMobileMenu();
  setupTypewriterBlink();
}

// Toggle mobile hamburger menu
function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    // Optional: Close menu when a link is clicked
    const links = menu.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
      });
    });
  }
}

// Blinking cursor effect
function setupTypewriterBlink() {
  const typewriter = document.querySelector('.typewriter');
  if (typewriter) {
    setInterval(() => {
      typewriter.style.borderRightColor =
        typewriter.style.borderRightColor === 'transparent' ? '#000' : 'transparent';
    }, 750);
  }
}