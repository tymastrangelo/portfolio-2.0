// Elements to load dynamically
const sectionsToLoad = {
  "nav-container": "/nav.html",
  "footer-container": "/footer.html"
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
  setupNavScroll();
  setActiveNavLink();
  setupPageTransitions();
  setupTypewriterEffect();
  updateCopyrightYear();
}

// Toggle mobile hamburger menu
function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-button');
  const hamburgerIcon = document.querySelector('.hamburger-icon');
  const menu = document.getElementById('mobile-menu');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      hamburgerIcon.classList.toggle('open');
      menu.classList.toggle('-translate-y-full');
    });
  }
}

// Add background to nav on scroll
function setupNavScroll() {
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    });
  }
}

// Add smooth page transitions
function setupPageTransitions() {
  document.body.addEventListener('click', function (e) {
    const link = e.target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');
    const isExternal = link.getAttribute('target') === '_blank' || (href && (href.startsWith('http') || href.startsWith('mailto:')));
    const isAnchor = href && href.startsWith('#');

    // Only apply to internal, non-anchor links
    if (href && !isExternal && !isAnchor) {
      e.preventDefault();
      
      document.body.classList.add('fade-out');

      setTimeout(() => {
        window.location.href = href;
      }, 200); // Match CSS transition duration
    }
  });
}

// Set active class on current page's nav link
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    // Handle index.html vs. root path
    const isIndex = (currentPath === '/' && linkPath.endsWith('index.html')) || (currentPath.endsWith('index.html') && linkPath === '/');
    if (linkPath === currentPath || isIndex) {
      // Add active styles directly
      link.classList.add('text-slate-900', 'font-semibold');
      if (!link.classList.contains('nav-link-cta')) { // Don't add bg to contact button
        link.classList.add('bg-slate-100');
      }
    }
  });
}

// Blinking cursor effect
async function setupTypewriterEffect() {
  const typewriterElement = document.querySelector('.typewriter');
  if (!typewriterElement) return;

  const roles = ["Student", "Developer", "Entrepreneur"];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typeSpeed = 150;
  const deleteSpeed = 100;
  const delayBetweenRoles = 1500;

  function type() {
    const currentRole = roles[roleIndex];
    let displayText = '';

    if (isDeleting) {
      displayText = currentRole.substring(0, charIndex - 1);
      charIndex--;
    } else {
      displayText = currentRole.substring(0, charIndex + 1);
      charIndex++;
    }

    typewriterElement.textContent = displayText;

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(type, delayBetweenRoles);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, typeSpeed);
    } else {
      setTimeout(type, isDeleting ? deleteSpeed : typeSpeed);
    }
  }
  type();
}

// Update footer copyright year
function updateCopyrightYear() {
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const titles = document.querySelectorAll(".project-title");
  const preview = document.getElementById("project-preview");
  const desc = document.getElementById("project-description");
  const link = document.getElementById("project-link");

  let active = null;

  const showProject = (title) => {
    const image = title.getAttribute("data-image");
    const description = title.getAttribute("data-description");
    const url = title.getAttribute("data-link");

    titles.forEach((t) => t.classList.remove("text-sky-600"));
    title.classList.add("text-sky-600");

    preview.src = image;
    desc.textContent = description;
    link.href = url || "#";

    preview.style.opacity = 1;
    preview.style.transform = "scale(1)";
    desc.style.opacity = 1;

    active = title;
  };

  // Desktop hover
  titles.forEach((title) => {
    title.addEventListener("mouseenter", () => {
      if (window.innerWidth >= 768) showProject(title);
    });

    // Mobile tap
    title.addEventListener("click", () => {
      showProject(title);
    });
  });

  // Auto-load first project
  if (titles.length > 0) showProject(titles[0]);
});

// Initial call in case nav/footer fail to load
document.addEventListener('DOMContentLoaded', initSiteFeatures);