document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initLayeredScroll();
});

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
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

function initLayeredScroll() {
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const layers = container.querySelectorAll('.layer');
    const footerLayer = document.getElementById('footer-layer');
    const allLayers = footerLayer ? [...layers, footerLayer] : [...layers];
    let vh = window.innerHeight;
    let totalScrollUnits = 0;
    const layerData = [];

    const lightShades = ['#fafaf9', '#f4f2ec'];

    allLayers.forEach((layer, i) => {
        const isHorizontal = layer.dataset.horizontalScroll !== undefined;
        const units = isHorizontal ? 2 : 1;
        layer.style.zIndex = i;
        layer.style.backgroundColor = lightShades[i % 2];

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

    function updateLayers() {
        const scrollY = window.scrollY;
        vh = window.innerHeight;

        allLayers.forEach((layer, i) => {
            const data = layerData[i];
            const progress = Math.min(Math.max((scrollY - data.entryPoint) / (data.units * vh), 0), 1);

            if (data.isHorizontal) {
                if (progress < 0.45) {
                    const slideProgress = progress / 0.45;
                    const eased = easeOutQuart(slideProgress);
                    layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
                } else {
                    layer.style.transform = 'translate3d(0, 0, 0)';
                }
            } else {
                const eased = easeOutQuart(progress);
                layer.style.transform = `translate3d(0, ${(1 - eased) * 100}vh, 0)`;
            }
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
            updateLayers();
        }, 150);
    }, { passive: true });

    updateLayers();
}
