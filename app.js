/* Service by Iman  |  Holographic Glass (final mockup)
   Progressive enhancement only: the page is complete without this file. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var mqFine = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var reduce = mqReduce.matches;
  var hasIO = 'IntersectionObserver' in window;

  function onChange(mq, fn) {
    if (!mq || !mq.addEventListener) { if (mq && mq.addListener) mq.addListener(fn); return; }
    mq.addEventListener('change', fn);
  }

  /* ---------- 1. Staggered reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function showAll() {
    for (var i = 0; i < revealEls.length; i++) revealEls[i].classList.add('is-in');
  }

  if (!reduce && hasIO && revealEls.length) {
    try {
      var revealIO = new IntersectionObserver(function (entries) {
        var incoming = [];
        entries.forEach(function (e) { if (e.isIntersecting) incoming.push(e); });
        incoming.sort(function (a, b) {
          var ta = Math.round(a.boundingClientRect.top / 40), tb = Math.round(b.boundingClientRect.top / 40);
          return (ta - tb) || (a.boundingClientRect.left - b.boundingClientRect.left);
        });
        incoming.forEach(function (e, i) {
          e.target.style.setProperty('--delay', Math.min(i, 5) * 110 + 'ms');
          e.target.classList.add('is-in');
          revealIO.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px 40px 0px', threshold: 0 });
      revealEls.forEach(function (el) { revealIO.observe(el); });
      doc.classList.add('js-reveal');
      window.addEventListener('beforeprint', showAll);
    } catch (err) {
      doc.classList.remove('js-reveal');
      showAll();
    }
  } else {
    showAll();
  }
  onChange(mqReduce, function (e) { reduce = e.matches; if (reduce) showAll(); });

  /* ---------- 2. Run card animations only while on screen ---------- */
  if (hasIO) {
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.live'), function (el) { liveIO.observe(el); });
    doc.classList.add('js-live');
  }

  /* ---------- 3. Star field (canvas) ---------- */
  var canvas = document.querySelector('.stars');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    var W = 0, H = 0, DPR = 1, stars = [], motes = [], raf = 0, last = 0, t0 = 0;
    var palette = ['rgba(214,206,255,0.9)', 'rgba(186,240,255,0.9)', 'rgba(255,204,236,0.85)', 'rgba(200,255,232,0.8)'];
    var sprites = palette.map(function (c) { return makeSprite(c); });
    var whiteSprite = makeSprite('rgba(255,255,255,0.95)');

    function makeSprite(color) {
      var s = document.createElement('canvas');
      s.width = s.height = 64;
      var c = s.getContext('2d');
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.18, color);
      g.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.18)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      return s;
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function seed() {
      var area = W * H;
      var nStars = Math.min(150, Math.round(area / 7200));
      var nMotes = Math.min(24, Math.round(area / 42000));
      stars = [];
      motes = [];
      for (var i = 0; i < nStars; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(0.5, 1.5), a: rand(0.35, 0.9),
          tw: rand(0.6, 2.2), ph: rand(0, Math.PI * 2),
          depth: rand(0.2, 1), vx: rand(-0.004, 0.004), vy: rand(-0.012, -0.002)
        });
      }
      for (var j = 0; j < nMotes; j++) {
        motes.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(2.2, 5.5), a: rand(0.18, 0.5),
          tw: rand(0.2, 0.6), ph: rand(0, Math.PI * 2),
          depth: rand(0.6, 1.4), vx: rand(-0.012, 0.012), vy: rand(-0.035, -0.012),
          s: sprites[j % sprites.length]
        });
      }
    }

    function size(reseed) {
      var rect = canvas.getBoundingClientRect();
      var nw = Math.max(1, Math.round(rect.width));
      var nh = Math.max(1, Math.round(rect.height));
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      if (!reseed && W && H) {
        var sx = nw / W, sy = nh / H;
        stars.forEach(function (p) { p.x *= sx; p.y *= sy; });
        motes.forEach(function (p) { p.x *= sx; p.y *= sy; });
      }
      W = nw; H = nh;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reseed || !stars.length) seed();
    }

    function wrap(v, max) { return ((v % max) + max) % max; }

    function draw(time, dt) {
      var sc = window.pageYOffset || 0;
      ctx.clearRect(0, 0, W, H);
      var i, p, alpha, y, d;
      for (i = 0; i < stars.length; i++) {
        p = stars[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -4) p.x += W + 8; else if (p.x > W + 4) p.x -= W + 8;
        if (p.y < -4) p.y += H + 8;
        alpha = p.a * (0.55 + 0.45 * Math.sin(time * 0.001 * p.tw + p.ph));
        y = wrap(p.y - sc * 0.04 * p.depth, H);
        d = p.r * 6;
        ctx.globalAlpha = alpha;
        ctx.drawImage(whiteSprite, p.x - d / 2, y - d / 2, d, d);
      }
      for (i = 0; i < motes.length; i++) {
        p = motes[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -30) p.x += W + 60; else if (p.x > W + 30) p.x -= W + 60;
        if (p.y < -30) p.y += H + 60;
        alpha = p.a * (0.6 + 0.4 * Math.sin(time * 0.001 * p.tw + p.ph));
        y = wrap(p.y - sc * 0.09 * p.depth, H + 60) - 30;
        d = p.r * 7;
        ctx.globalAlpha = alpha;
        ctx.drawImage(p.s, p.x - d / 2, y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!t0) t0 = now;
      var dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      draw(now - t0, dt);
      raf = window.requestAnimationFrame(loop);
    }

    function start() {
      if (raf || reduce || document.hidden) return;
      last = 0;
      raf = window.requestAnimationFrame(loop);
    }
    function stop() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }
    function drawStatic() { draw(0, 0); }

    size(true);
    if (reduce) drawStatic(); else start();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    onChange(mqReduce, function (e) {
      if (e.matches) { stop(); drawStatic(); } else { start(); }
    });

    var resizeTimer = 0, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var widthChanged = Math.abs(window.innerWidth - lastW) > 40;
        lastW = window.innerWidth;
        size(widthChanged);
        if (!raf) drawStatic();
      }, 160);
    }, { passive: true });
  }

  /* ---------- 4. Pointer-only: tilt, glare, magnetic buttons, cursor light ---------- */
  function initPointerFX() {
    if (!mqFine.matches || reduce) return;

    // Cursor light in the background
    var aura = document.querySelector('.cursor-aura');
    if (aura) {
      var ax = window.innerWidth / 2, ay = window.innerHeight / 3, tx = ax, ty = ay, aRaf = 0;
      var auraFrame = function () {
        ax += (tx - ax) * 0.12; ay += (ty - ay) * 0.12;
        aura.style.transform = 'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0)';
        if (Math.abs(tx - ax) > 0.3 || Math.abs(ty - ay) > 0.3) aRaf = window.requestAnimationFrame(auraFrame);
        else aRaf = 0;
      };
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        aura.classList.add('is-on');
        if (!aRaf) aRaf = window.requestAnimationFrame(auraFrame);
      }, { passive: true });
      document.addEventListener('pointerleave', function () { aura.classList.remove('is-on'); });
    }

    // 3D tilt + specular glare
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
      var inner = card.querySelector('.card-inner');
      var glare = card.querySelector('.glare');
      if (!inner) return;
      var MAX = 6.5;
      var tX = 0, tY = 0, cX = 0, cY = 0, gx = 0, gy = 0, active = false, fr = 0;

      function frame() {
        cX += (tX - cX) * 0.14;
        cY += (tY - cY) * 0.14;
        inner.style.transform = 'perspective(1100px) rotateX(' + cY.toFixed(3) + 'deg) rotateY(' + cX.toFixed(3) + 'deg) translateZ(0)';
        if (glare) glare.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
        if (active || Math.abs(tX - cX) > 0.02 || Math.abs(tY - cY) > 0.02) {
          fr = window.requestAnimationFrame(frame);
        } else {
          fr = 0;
          inner.style.transform = '';
          inner.style.transition = '';
        }
      }

      card.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        tX = (px - 0.5) * 2 * MAX;
        tY = -(py - 0.5) * 2 * MAX;
        gx = e.clientX - r.left;
        gy = e.clientY - r.top;
        if (!active) {
          active = true;
          inner.style.transition = 'box-shadow .5s ease';
          card.classList.add('is-hover');
        }
        if (!fr) fr = window.requestAnimationFrame(frame);
      }, { passive: true });

      card.addEventListener('pointerleave', function () {
        active = false;
        tX = 0; tY = 0;
        card.classList.remove('is-hover');
        if (!fr) fr = window.requestAnimationFrame(frame);
      });
    });

    // Magnetic buttons
    Array.prototype.forEach.call(document.querySelectorAll('.btn, .scroll-cue, .to-top'), function (btn) {
      var STRENGTH = btn.classList.contains('btn') ? 5 : 7;
      btn.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform = 'translate3d(' + (dx * STRENGTH).toFixed(2) + 'px,' + (dy * STRENGTH * 0.6 - 2).toFixed(2) + 'px,0)';
      }, { passive: true });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  initPointerFX();
})();
