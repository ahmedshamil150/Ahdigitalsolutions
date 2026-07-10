document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initLayeredScroll();
    initMobileMenu();
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
        layer.style.zIndex = i;
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

function initServiceModal() {
    var modal = document.getElementById('svcModal');
    if (!modal) return;

    var bg = modal.querySelector('.svc-modal-bg');
    var close = modal.querySelector('.svc-modal-close');
    var titleEl = document.getElementById('svcModalTitle');
    var bodyEl = document.getElementById('svcModalBody');

    var details = {
        'custom-website-design': {
            title: 'Custom Website Design',
            body: 'We create unique, hand-crafted designs tailored to your brand identity instead of relying on generic templates. Every pixel is considered, every interaction intentional. The result is a website that feels unmistakably yours — building trust with your audience from the first click.'
        },
        'small-apps-tools': {
            title: 'Small Apps & Tools',
            body: 'Lightweight web applications and custom business tools designed to automate repetitive tasks, streamline workflows, and improve customer service. From booking systems to internal dashboards, we build tools that save you time and scale with your business.'
        },
        'web-design-uiux': {
            title: 'Web Design & UI/UX',
            body: 'Visually stunning and intuitively structured interfaces optimized to convert visitors into customers. We combine aesthetic excellence with user research to create experiences that feel natural, reduce friction, and drive measurable results.'
        },
        'responsive-design': {
            title: 'Responsive Design',
            body: 'Websites built to function flawlessly across every device — mobile, tablet, and desktop. We ensure your content looks great and performs perfectly at any screen size, so you never miss an opportunity to connect with your audience.'
        },
        'ecommerce-solutions': {
            title: 'E-commerce Solutions',
            body: 'Fully integrated online store setups that make it easy to sell products and services. From product catalogs and shopping carts to secure payment gateways and order management, we build e-commerce experiences that drive revenue.'
        },
        'email-design': {
            title: 'Email Design',
            body: 'Branded email templates and campaigns designed to engage subscribers, nurture leads, and boost conversions. We create emails that look great in every inbox and drive real engagement for your business.'
        },
        'fast-loading-speed': {
            title: 'Fast Loading Speed',
            body: 'Performance optimization is at the core of everything we build. We optimize code, images, and infrastructure to ensure quick load times that keep visitors engaged and improve your search engine rankings.'
        },
        'seo-friendly-structure': {
            title: 'SEO-Friendly Structure',
            body: 'Websites built with search engine best practices baked in from the ground up. Clean semantic markup, fast performance, proper metadata, and mobile-first design — so potential customers can find you easily.'
        },
        'contact-forms-lead': {
            title: 'Contact Forms & Lead Generation',
            body: 'Smart, strategically placed forms designed to seamlessly capture inquiries and turn traffic into leads. We design forms that are easy to use, integrate with your CRM, and optimized for conversion.'
        },
        'website-maintenance': {
            title: 'Website Maintenance',
            body: 'Ongoing support, security monitoring, and regular updates to keep your website running smoothly and securely. From plugin updates to performance audits, we handle the technical details so you can focus on your business.'
        }
    };

    function openModal(key) {
        var data = details[key];
        if (!data) return;
        titleEl.textContent = data.title;
        bodyEl.textContent = data.body;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.svc-learn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var card = btn.closest('.svc-card');
            if (card) openModal(card.dataset.service);
        });
    });

    close.addEventListener('click', closeModal);
    bg.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initServiceModal();
});
