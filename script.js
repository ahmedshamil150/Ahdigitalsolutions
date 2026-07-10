document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initScrollAnimations();
    initHeaderScroll();
    initLayeredScroll();
    initLazyLoading();
});

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.service-card, .stat-item, .capability-item');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
}

function initHeaderScroll() {
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function initLayeredScroll() {
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const layers = container.querySelectorAll('.layer');
    const footerLayer = document.getElementById('footer-layer');
    const allLayers = footerLayer ? [...layers, footerLayer] : [...layers];
    const numLayers = allLayers.length;

    let vh = window.innerHeight;
    let horizontalIndex = -1;
    let totalScrollUnits = 0;
    const layerData = [];

    const lightShades = ['#fafaf9', '#f4f2ec'];

    allLayers.forEach((layer, i) => {
        const isHorizontal = layer.dataset.horizontalScroll !== undefined;
        const units = isHorizontal ? 2 : 1;
        if (isHorizontal) horizontalIndex = i;
        layer.style.zIndex = i;
        if (!layer.classList.contains('hero')) {
            layer.style.backgroundColor = lightShades[i % 2];
        }

        let entryPoint = totalScrollUnits * vh;
        layerData.push({
            element: layer,
            index: i,
            isHorizontal,
            units,
            entryPoint: i === 0 ? 0 : entryPoint,
        });

        if (i > 0) {
            totalScrollUnits += units;
        }
    });

    container.style.height = ((totalScrollUnits + 1) * vh) + 'px';

    const categoriesTrack = document.getElementById('categories-track');
    let maxTrackScroll = 0;
    if (categoriesTrack) {
        maxTrackScroll = Math.max(0, categoriesTrack.scrollWidth - window.innerWidth);
    }

    function updateLayers() {
        const scrollY = window.scrollY;
        vh = window.innerHeight;

        const rawIndex = scrollY / vh;
        const currentIndex = Math.min(Math.floor(rawIndex + 0.55), numLayers - 1);

        allLayers.forEach((layer, i) => {
            if (i === 0) {
                layer.style.transform = 'translate3d(0, 0, 0)';
                return;
            }

            const data = layerData[i];
            const progress = Math.min(Math.max((scrollY - data.entryPoint) / (data.units * vh), 0), 1);

            if (data.isHorizontal) {
                if (progress < 0.45) {
                    const slideProgress = progress / 0.45;
                    const eased = easeOutQuart(slideProgress);
                    layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
                } else {
                    layer.style.transform = 'translate3d(0, 0, 0)';
                    if (categoriesTrack) {
                        const horizProgress = Math.min(Math.max((progress - 0.45) / 0.55, 0), 1);
                        const easedHoriz = easeOutCubic(horizProgress);
                        const tx = -easedHoriz * maxTrackScroll;
                        categoriesTrack.style.transform = `translate3d(${tx}px, 0, 0)`;
                    }
                }
            } else {
                const eased = easeOutQuart(progress);
                layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
            }
        });

        allLayers.forEach((layer, i) => {
            layer.classList.toggle('layer-active', i === currentIndex);
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
            allLayers.forEach((data, i) => {
                if (i === 0) return;
                let cumulativeUnits = 0;
                for (let j = 1; j < i; j++) {
                    cumulativeUnits += allLayers[j].dataset.horizontalScroll !== undefined ? 2 : 1;
                }
                layerData[i].entryPoint = cumulativeUnits * vh;
            });
            container.style.height = ((totalScrollUnits + 1) * vh) + 'px';
            if (categoriesTrack) {
                maxTrackScroll = Math.max(0, categoriesTrack.scrollWidth - window.innerWidth);
            }
            updateLayers();
        }, 150);
    }, { passive: true });

    updateLayers();
}

function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

if (window.performance) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime + 'ms');
    });
}
