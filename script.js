document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initLayeredScroll();
    initMobileMenu();
});

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function initHeaderScroll() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

function initLayeredScroll() {
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const allLayers = container.querySelectorAll('.layer');
    let vh = window.innerHeight;
    let totalScrollUnits = 0;
    const layerData = [];

    allLayers.forEach((layer, i) => {
        const units = 1.5;
        layer.style.zIndex = i;

        const entryPoint = totalScrollUnits * vh;
        layerData.push({ element: layer, index: i, units, entryPoint });
        totalScrollUnits += units;
    });

    container.style.height = ((totalScrollUnits + 1) * vh) + 'px';

    function updateLayers() {
        const scrollY = window.scrollY;
        vh = window.innerHeight;

        allLayers.forEach((layer, i) => {
            const data = layerData[i];
            const progress = Math.min(Math.max((scrollY - data.entryPoint) / (data.units * vh), 0), 1);
            const eased = easeOutQuart(progress);
            layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
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

    function recalcEntryPoints() {
        let cumulative = 0;
        allLayers.forEach((layer, i) => {
            layerData[i].entryPoint = cumulative * vh;
            cumulative += 1.5;
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            vh = window.innerHeight;
            recalcEntryPoints();
            container.style.height = ((totalScrollUnits + 1) * vh) + 'px';
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
