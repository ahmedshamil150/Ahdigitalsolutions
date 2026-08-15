(function () {
  'use strict';

  if (!('requestAnimationFrame' in window)) return;

  var PREFERS_REDUCED =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function easeOutCubic(p) {
    var inv = 1 - p;
    return 1 - inv * inv * inv;
  }

  function tween(from, to, dur, ease, onUpdate) {
    if (dur <= 0) {
      onUpdate(to);
      return function () {};
    }
    var start = performance.now();
    var cancelled = false;
    function frame(now) {
      if (cancelled) return;
      var p = Math.min((now - start) / (dur * 1000), 1);
      onUpdate(from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function () {
      cancelled = true;
    };
  }

  function init(root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll('.ag-panel'));
    var count = panels.length;
    if (!count) return;

    var data = root.dataset;
    var duration = parseFloat(data.agDuration || '0.6') || 0.6;
    var ease = easeOutCubic;
    var parallax = parseFloat(data.agParallax || '0.5') || 0.5;
    var tilt = parseFloat(data.agTilt || '8') || 8;
    var gap = parseFloat(data.agGap || '10') || 10;
    var expandRatio = Math.min(Math.max(parseFloat(data.agExpandRatio || '0.52') || 0.52, 0.2), 0.9);
    var trigger = data.agTrigger || 'hover';
    var defaultIndex = Math.min(Math.max(parseInt(data.agDefaultIndex || '0', 10) || 0, 0), count - 1);

    var mediaSize = 320;
    var active = defaultIndex;
    var firstRun = true;
    var cancels = [];
    var mq = window.matchMedia('(max-width: 520px)');

    root.style.height = data.agHeight || '460px';

    function killTweens() {
      for (var i = 0; i < cancels.length; i++) cancels[i]();
      cancels = [];
    }

    function measure() {
      var rect = root.getBoundingClientRect();
      var total = rect.width;
      var usable = Math.max(total - gap * (count - 1), 120);
      mediaSize = Math.max(140, usable * expandRatio * 1.22);
      root.style.setProperty('--ag-media-size', mediaSize + 'px');
    }

    function applyLayout(animate) {
      killTweens();
      var dur = animate && !PREFERS_REDUCED && !mq.matches ? duration : 0;
      var reduced = PREFERS_REDUCED || mq.matches;
      var grow = count > 1 ? (expandRatio * (count - 1)) / (1 - expandRatio) : 1;

      panels.forEach(function (panel, i) {
        var isActive = i === active;
        var media = panel.querySelector('.ag-panel__media');
        var label = panel.querySelector('.ag-panel__label');
        var rot = isActive ? 0 : i < active ? tilt : -tilt;

        cancels.push(
          tween(parseFloat(panel.style.flexGrow) || 1, isActive ? grow : 1, dur, ease, function (v) {
            panel.style.flexGrow = v;
          })
        );

        if (!reduced) {
          cancels.push(
            tween(
              getRot(panel),
              rot,
              dur,
              ease,
              (function (el, target) {
                return function (v) {
                  el.style.transform = 'perspective(1200px) rotateY(' + v + 'deg)';
                };
              })(panel, rot)
            )
          );
        } else {
          panel.style.transform = '';
        }

        if (media) {
          var drift = Math.max(-1.5, Math.min(1.5, active - i));
          var shift = drift * parallax * mediaSize * 0.06;
          cancels.push(
            tween(getMediaX(media), isActive ? 0 : shift, dur, ease, function (v) {
              media.style.transform = 'translate(-50%, -50%) translateX(' + v + 'px)';
            })
          );
          var grayFrom = parseFloat(getComputedStyle(media).getPropertyValue('--ag-gray')) || 1;
          var dimFrom = parseFloat(getComputedStyle(media).getPropertyValue('--ag-dim')) || 0.35;
          cancels.push(
            tween(grayFrom, grayscaleOf(isActive), dur, ease, function (v) {
              media.style.setProperty('--ag-gray', v);
            })
          );
          cancels.push(
            tween(dimFrom, isActive ? 0 : 0.35, dur, ease, function (v) {
              media.style.setProperty('--ag-dim', v);
            })
          );
        }

        if (label) {
          if (isActive) {
            cancels.push(
              tween(parseFloat(label.style.opacity) || 0, 1, dur, ease, function (v) {
                label.style.opacity = v;
              })
            );
            cancels.push(
              tween(parseFloat(label.style.translateX) || -14, 0, dur, ease, function (v) {
                label.style.translateX = v;
              })
            );
          } else {
            cancels.push(
              tween(parseFloat(label.style.opacity) || 0, 0, dur * 0.6, ease, function (v) {
                label.style.opacity = v;
              })
            );
            cancels.push(
              tween(parseFloat(label.style.translateX) || 0, -14, dur * 0.6, ease, function (v) {
                label.style.translateX = v;
              })
            );
          }
        }

        panel.classList.toggle('ag-panel--active', isActive);
        if (isActive) panel.setAttribute('aria-current', 'true');
        else panel.removeAttribute('aria-current');
      });
    }

    function getRot(el) {
      var m = el.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
      return m ? parseFloat(m[1]) : 0;
    }

    function getMediaX(el) {
      var m = el.style.transform.match(/translateX\(([-\d.]+)px\)/);
      return m ? parseFloat(m[1]) : 0;
    }

    function grayscaleOf(isActive) {
      var gray = data.agGrayscale;
      var useGray = gray === undefined ? true : gray !== 'false';
      return useGray ? (isActive ? 0 : 1) : 0;
    }

    function setActive(i, animate) {
      if (i === active) return;
      active = i;
      applyLayout(animate === undefined ? true : animate);
    }

    measure();
    applyLayout(!firstRun);
    firstRun = false;

    var ro = new ResizeObserver(function () {
      measure();
      applyLayout(false);
    });
    ro.observe(root);

    function activate(i, e) {
      if (i !== active && e && (e.type === 'click' || e.type === 'keydown' || e.type === 'focus')) {
        if (e.type === 'click') e.preventDefault();
        setActive(i, !PREFERS_REDUCED);
        return;
      }
      if (trigger === 'hover') setActive(i, !PREFERS_REDUCED);
    }

    panels.forEach(function (panel, i) {
      panel.addEventListener('mouseenter', function (e) {
        if (trigger === 'hover') {
          e.preventDefault && e.preventDefault();
          setActive(i, !PREFERS_REDUCED);
        }
      });
      panel.addEventListener('click', function (e) {
        if (i !== active) {
          e.preventDefault();
          setActive(i, !PREFERS_REDUCED);
        }
      });
      panel.addEventListener('focus', function () {
        setActive(i, !PREFERS_REDUCED);
      });
      panel.addEventListener('keydown', function (e) {
        var next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % count;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + count) % count;
        if (next >= 0) {
          e.preventDefault();
          setActive(next, !PREFERS_REDUCED);
          panels[next].focus();
        }
      });
    });

    if (mq.addEventListener) {
      mq.addEventListener('change', function () {
        panels.forEach(function (panel) {
          panel.style.flexGrow = '1';
          panel.style.transform = '';
        });
        applyLayout(false);
      });
    }
  }

  var roots = document.querySelectorAll('.accordion-gallery');
  Array.prototype.forEach.call(roots, init);
})();