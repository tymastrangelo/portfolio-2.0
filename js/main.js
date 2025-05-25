// Load external HTML into container elements
const sections = {
    "nav-container": "nav.html",
    "home": "home.html",
    "about": "about.html",
    "projects": "projects.html",
    "contact": "contact.html",
    "footer-container": "footer.html"
};

for (const [id, file] of Object.entries(sections)) {
    fetch(file)
        .then(response => response.text())
        .then(html => {
            document.getElementById(id).innerHTML = html;

            // After loading all sections, activate routing
            if (id === "footer-container") {
                initRouting(); // setup navigation once all content is loaded
            }
        });
}

// Navigation page switcher
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });

    const pageEl = document.getElementById(pageId);
    if (pageEl) {
        pageEl.classList.add('active-page');
    }

    window.scrollTo(0, 0);
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.add('hidden');
}

// Setup mobile nav + typewriter after content loads
function initRouting() {
    const mobileBtn = document.getElementById('mobile-menu-button');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const menu = document.getElementById('mobile-menu');
            if (menu) menu.classList.toggle('hidden');
        });
    }

    // Typewriter blinking cursor
    const typewriter = document.querySelector('.typewriter');
    if (typewriter) {
        setInterval(() => {
            typewriter.style.borderRightColor = typewriter.style.borderRightColor === 'transparent' ? '#000' : 'transparent';
        }, 750);
    }

    // Show default page
    if (!window.location.hash) {
        showPage('home');
    } else {
        showPage(window.location.hash.substring(1));
    }
}