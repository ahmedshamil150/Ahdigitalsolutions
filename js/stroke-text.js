(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  var PREFERS_REDUCED = false;
  try {
    PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  function easeOut(p) { return 1 - Math.pow(1 - p, 2); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function tween(from, to, duration, ease, onUpdate, onDone) {
    var start = null;
    var raf = null;
    var cancelled = false;

    function frame(now) {
      if (cancelled) return;
      if (start === null) start = now;
      var progress = duration <= 0 ? 1 : Math.min(1, (now - start) / (duration * 1000));
      onUpdate(from + (to - from) * ease(progress), progress);
      if (progress < 1) {
        raf = window.requestAnimationFrame(frame);
      } else if (onDone) {
        onDone();
      }
    }

    raf = window.requestAnimationFrame(frame);
    return { cancel: function () { cancelled = true; if (raf) window.cancelAnimationFrame(raf); } };
  }

  function clampFont(el, current) {
    var css = window.getComputedStyle(el);
    var size = parseFloat(css.fontSize);
    if (!isNaN(size) && size > 0 && current !== size) return size;
    return current;
  }

  function buildStrokeText(el) {
    if (!el || el.getAttribute('data-stroke-bound')) return;
    var text = (el.textContent || '').trim();
    if (!text) return;

    el.setAttribute('data-stroke-bound', '1');
    el.textContent = '';

    var cfg = {
      strokeColor: el.getAttribute('data-stroke-color') || '#9fe8ff',
      strokeWidth: parseFloat(el.getAttribute('data-stroke-width')) || 1.4,
      drawDuration: parseFloat(el.getAttribute('data-draw-duration')) || 1.4,
      fillDelay: parseFloat(el.getAttribute('data-fill-delay')) || 0.15,
      stagger: parseFloat(el.getAttribute('data-stagger')) || 0.04,
      trigger: el.getAttribute('data-trigger') || 'mount',
      fontSize: parseFloat(el.getAttribute('data-font-size')) || 0
    };

    var css = window.getComputedStyle(el);
    var fontSize = (cfg.fontSize || parseFloat(css.fontSize) || 72) * 1.18;
    var fontWeight = css.fontWeight || '800';
    if (['800', '900', 'bold'].indexOf(fontWeight) !== -1) fontWeight = '600';
    var fontFamily = css.fontFamily;
    var letterSpacing = parseFloat(css.letterSpacing);
    if (isNaN(letterSpacing)) letterSpacing = 0;
    var fillColor = css.color;

    var dash = Math.max(fontSize * 7, 200);
    var pad = Math.max(cfg.strokeWidth, fontSize * 0.1);

    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', text);

    var sr = document.createElement('span');
    sr.className = 'stroke-text-sr';
    sr.textContent = text;
    el.appendChild(sr);

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'stroke-text');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.height = Math.round(fontSize * 1.1) + 'px';
    svg.style.width = 'auto';
    svg.style.maxWidth = '100%';
    svg.style.opacity = '0';

    var wipeId = 'stroke-wipe-' + (++uid);

    var defs = document.createElementNS(SVG_NS, 'defs');
    var clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', wipeId);
    clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
    var wipeRect = document.createElementNS(SVG_NS, 'rect');
    wipeRect.setAttribute('x', '0');
    wipeRect.setAttribute('y', '0');
    wipeRect.setAttribute('width', '0');
    wipeRect.setAttribute('height', '0');
    clipPath.appendChild(wipeRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    function makeText(fill, stroke) {
      var t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', '0');
      t.setAttribute('y', '0');
      t.setAttribute('font-family', fontFamily);
      t.setAttribute('font-size', fontSize);
      t.setAttribute('font-weight', fontWeight);
      if (letterSpacing) t.setAttribute('letter-spacing', letterSpacing);
      t.setAttribute('fill', fill);
      if (stroke) {
        t.setAttribute('stroke', stroke.stroke);
        t.setAttribute('stroke-width', stroke.width);
        t.setAttribute('stroke-linejoin', 'round');
        t.setAttribute('stroke-linecap', 'round');
      }
      return t;
    }

    var strokeText = makeText('none', { stroke: cfg.strokeColor, width: cfg.strokeWidth });
    var fillText = makeText(fillColor, null);
    fillText.setAttribute('clip-path', 'url(#' + wipeId + ')');

    var chars = Array.from(text);
    chars.forEach(function (ch) {
      var s = document.createElementNS(SVG_NS, 'tspan');
      s.setAttribute('data-stroke-char', '1');
      s.textContent = ch;
      strokeText.appendChild(s);

      var f = document.createElementNS(SVG_NS, 'tspan');
      f.setAttribute('data-fill-char', '1');
      f.textContent = ch;
      fillText.appendChild(f);
    });

    svg.appendChild(strokeText);
    svg.appendChild(fillText);
    el.appendChild(svg);

    var box = null;
    var slideIds = [];
    var started = false;

    function renderBox() {
      var b;
      try {
        b = strokeText.getBBox();
      } catch (e) {
        b = null;
      }
      if (!b || !b.width) return false;
      box = {
        x: b.x - pad,
        y: b.y - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2
      };
      svg.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height);
      wipeRect.setAttribute('x', box.x);
      wipeRect.setAttribute('y', box.y);
      wipeRect.setAttribute('height', box.height);
      return true;
    }

    function setEnd() {
      Array.prototype.forEach.call(strokeText.querySelectorAll('[data-stroke-char]'), function (s) {
        s.setAttribute('stroke-dasharray', dash);
        s.setAttribute('stroke-dashoffset', 0);
      });
      if (wipeRect) wipeRect.setAttribute('width', box ? box.width : 0);
      svg.style.opacity = '1';
    }

    function setStart() {
      Array.prototype.forEach.call(strokeText.querySelectorAll('[data-stroke-char]'), function (s) {
        s.setAttribute('stroke-dasharray', dash);
        s.setAttribute('stroke-dashoffset', dash);
      });
      wipeRect.setAttribute('width', '0');
      svg.style.opacity = '1';
    }

    function killTweens() {
      slideIds.forEach(function (h) {
        if (h && h.cancel) h.cancel();
      });
      slideIds = [];
    }

    function animate() {
      if (started) return;
      started = true;
      if (!renderBox()) return;
      setStart();

      if (PREFERS_REDUCED) {
        setEnd();
        return;
      }

      var strokes = strokeText.querySelectorAll('[data-stroke-char]');
      var n = strokes.length;
      var drawDone = (cfg.drawDuration + (n - 1) * cfg.stagger) * 1000;

      Array.prototype.forEach.call(strokes, function (s, i) {
        window.setTimeout(function () {
          slideIds.push(tween(dash, 0, cfg.drawDuration, easeOut, function (v) {
            s.setAttribute('stroke-dashoffset', v);
          }));
        }, i * cfg.stagger * 1000);
      });

      var fillDuration = Math.max(0.4, cfg.drawDuration * 0.5);
      window.setTimeout(function () {
        slideIds.push(tween(0, box.width, fillDuration, easeInOut, function (v) {
          wipeRect.setAttribute('width', v);
        }));
      }, drawDone + cfg.fillDelay * 1000);
    }

    window.setTimeout(function () {
      if (!renderBox()) {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            if (renderBox()) startTrigger();
          }).catch(function () {});
        }
        return;
      }
      startTrigger();
    }, 0);

    function startTrigger() {
      if (cfg.trigger === 'scroll' && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              io.disconnect();
              animate();
            }
          });
        }, { threshold: 0.15 });
        io.observe(el);
      } else if (cfg.trigger === 'hover') {
        setEnd();
        el.addEventListener('mouseenter', function () {
          killTweens();
          started = false;
          animate();
        });
      } else if (PREFERS_REDUCED) {
        setEnd();
      } else {
        animate();
      }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var size = cfg.fontSize || parseFloat(window.getComputedStyle(el).fontSize);
        if (!isNaN(size) && size > 0) {
          fontSize = size;
          dash = Math.max(fontSize * 7, 200);
          pad = Math.max(cfg.strokeWidth, fontSize * 0.1);
          svg.style.height = Math.round(fontSize * 1.3) + 'px';
          strokeText.setAttribute('font-size', fontSize);
          fillText.setAttribute('font-size', fontSize);
        }
        if (renderBox()) setEnd();
      }, 150);
    });
  }

  function initAll() {
    var lines = document.querySelectorAll('.hero-title .hero-line');
    Array.prototype.forEach.call(lines, function (line) {
      buildStrokeText(line);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();