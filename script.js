document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initLayerAnimations();
    initMobileMenu();
});

function initHeaderScroll() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

function initLayerAnimations() {
    const layers = document.querySelectorAll('.layer');

    if (layers.length > 0) {
        layers[0].classList.add('visible');
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
    });

    layers.forEach((layer, i) => {
        if (i > 0) observer.observe(layer);
    });
}

function initMobileMenu() {
    var hamburger = document.querySelector('.hamburger');
    if (!hamburger) return;

    var overlay = document.createElement('div');
    overlay.className = 'mobile-menu';
    var links = document.querySelectorAll('.nav-links a');
    links.forEach(function (link) {
        var a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent;
        a.addEventListener('click', closeMenu);
        overlay.appendChild(a);
    });
    document.body.appendChild(overlay);

    function toggleMenu() {
        hamburger.classList.toggle('active');
        overlay.classList.toggle('open');
        document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
    }

    function closeMenu() {
        hamburger.classList.remove('active');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeMenu();
    });
}
