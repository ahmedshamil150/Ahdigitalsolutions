document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        setTimeout(() => {
            initHeaderScroll();
            initLayeredScroll();
            initMobileMenu();
            initServicesReveal();
        }, 50);
    });
});

function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
}

function initHeaderScroll() {
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

function initLayeredScroll() {
    if (window.innerWidth <= 768) return;
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const allLayers = container.querySelectorAll('.layer');
    let vh = window.innerHeight;
    const layerData = [];

    function getSlideDir(layer) {
        if (window.innerWidth <= 768) return null;
        const slide = layer.dataset.slide;
        if (slide === 'right' || slide === 'left' || slide === 'none') return slide;
        return null;
    }

    function getUnits(layer) {
        if (layer.dataset.units) return parseFloat(layer.dataset.units);
        const dir = getSlideDir(layer);
        if (dir === 'none') return 0;
        return dir ? 1 : 1.5;
    }

    function calcTotalUnits() {
        let total = 0;
        allLayers.forEach(layer => {
            total += getUnits(layer);
        });
        return total;
    }

    allLayers.forEach((layer, i) => {
        layer.style.zIndex = 100 + i;
        layerData.push({ element: layer, index: i });
    });

    container.style.height = ((calcTotalUnits() + 1) * vh) + 'px';

    function updateLayers() {
        const scrollY = window.scrollY;
        vh = window.innerHeight;
        let cumulative = 0;

        allLayers.forEach((layer, i) => {
            const dir = getSlideDir(layer);
            const units = getUnits(layer);
            const entryPoint = cumulative * vh;
            const progress = Math.min(Math.max((scrollY - entryPoint) / (units * vh), 0), 1);
            const eased = easeOutQuint(progress);

            if (dir === 'right') {
                layer.style.transform = `translate3d(${(1 - eased) * 110}vw, 0, 0)`;
            } else if (dir === 'left') {
                layer.style.transform = `translate3d(${-(1 - eased) * 110}vw, 0, 0)`;
            } else if (dir === 'none') {
                layer.style.transform = 'none';
            } else {
                layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
            }

            cumulative += units;
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateLayers();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            vh = window.innerHeight;
            container.style.height = ((calcTotalUnits() + 1) * vh) + 'px';
            updateLayers();
        }, 150);
    }, { passive: true });

    updateLayers();
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

function initServicesReveal() {
    var section = document.querySelector('.services-layer');
    if (!section || window.innerWidth <= 768) return;
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                section.classList.add('is-visible');
                obs.disconnect();
            }
        });
    }, { threshold: 0.3 });
    obs.observe(section);
}

function initHeroCarousel() {
    var slides = document.querySelectorAll('.hero-carousel-slide');
    if (slides.length < 2) return;
    var current = 0;
    slides[0].classList.add('active');
    setInterval(function () {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }, 4000);
}



