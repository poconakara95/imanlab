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

  /* ---------- 5. Photos: fade in over the blurred preview once loaded ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.card-media .photo'), function (img) {
    function done() { img.classList.add('is-loaded'); }
    if (img.complete && img.naturalWidth) { done(); return; }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* ---------- 6. Install popup ----------
     Always offers install on phones: a one-tap "Pasang" when the browser allows it (beforeinstallprompt,
     which Chrome only fires after some engagement), otherwise short steps for that browser. */
  (function () {
    var box = document.getElementById('install');
    if (!box) return;
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (standalone) return;
    var KEY = 'sbi-install-snooze', DAYS = 14;
    function snoozed() {
      try { var t = Number(localStorage.getItem(KEY)); return t > 0 && Date.now() - t < DAYS * 864e5; } catch (e) { return false; }
    }
    function snooze() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
    if (snoozed()) return;

    var ua = navigator.userAgent || '';
    if (/FBAN|FBAV|Instagram|Line\/|TikTok|musical_ly|WhatsApp|Snapchat/i.test(ua)) return;
    var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/.test(ua);
    var isFirefox = /Firefox|FxiOS/.test(ua);
    var isChromium = /Chrome|Chromium|Edg\//.test(ua) && !isFirefox;
    var isMacSafari = !isIOS && /Macintosh/.test(ua) && /Version\/\d+.*Safari/.test(ua) && !isChromium;
    var os = isIOS ? 'ios' : isAndroid ? (isFirefox ? '' : 'android') : isChromium ? 'desktop' : isMacSafari ? 'mac-safari' : '';

    var yes = document.getElementById('install-yes');
    var no = document.getElementById('install-no');
    var steps = box.querySelectorAll('.install-steps');
    var deferred = null, shown = false, timer = 0;

    function render() {
      var oneTap = !!deferred;
      yes.hidden = !oneTap;
      no.textContent = oneTap ? 'Nanti' : 'Faham';
      Array.prototype.forEach.call(steps, function (p) { p.hidden = oneTap || p.getAttribute('data-os') !== os; });
    }
    function open() {
      if (shown || (!deferred && !os)) return;
      shown = true;
      render();
      box.hidden = false;
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { box.classList.add('is-open'); }); });
    }
    function close(remember) {
      if (remember) snooze();
      box.classList.remove('is-open');
      window.setTimeout(function () { box.hidden = true; }, 450);
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      if (shown) render(); else { window.clearTimeout(timer); timer = window.setTimeout(open, 1500); }
    });
    window.addEventListener('appinstalled', function () { snooze(); close(false); });
    if (os) timer = window.setTimeout(open, 5000);

    yes.addEventListener('click', function () {
      if (!deferred) { close(true); return; }
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; close(true); }, function () { close(true); });
    });
    no.addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && shown && !box.hidden) close(true); });
  })();

  // 7. Iman AI chatbot widget. Common questions answer instantly & free (hard-coded);
  //    anything else goes to /api/chat (Cloudflare Workers AI). Graceful if the API is down.
  (function () {
    if (!document.body) return;
    var WA = 'https://wa.me/60109184070?text=';
    var FACE = 'images/iman-ai-face.png';
    var CHAR = 'images/iman-ai.png';

    var replies = [
      {id:'semua',label:'Semua servis',key:['semua','servis','service','apa ada','ada apa','senarai','list'],
       html:'Iman ada <b>10 servis</b>, cover seluruh Malaysia:'+
        '<span class="iai-li"><b>1.</b> Anti Curang</span><span class="iai-li"><b>2.</b> Renang</span><span class="iai-li"><b>3.</b> Mengaji</span><span class="iai-li"><b>4.</b> Ajar Motor/Kereta</span><span class="iai-li"><b>5.</b> Jaga Budak</span><span class="iai-li"><b>6.</b> Joyride Motor Besar</span><span class="iai-li"><b>7.</b> Hantar Ke Mana Sahaja</span><span class="iai-li"><b>8.</b> Memasak</span><span class="iai-li"><b>9.</b> Teman Borak</span><span class="iai-li"><b>10.</b> Implant Gigi</span>'+
        'Nak tahu lebih dalam yang mana? Taip je namanya.'},
      {id:'anti',label:'Anti Curang',key:['anti curang','curang','check pasangan'],
       html:'<b>Anti Curang</b> — hati mula ragu? Jangan pendam sorang. Iman bantu dengan rundingan sulit & berhemah, biar kau dapat kepastian.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis anti curang.'}},
      {id:'renang',label:'Renang',key:['renang','berenang','swim'],
       html:'<b>Renang</b> — kelas dari asas sampai yakin dalam air, untuk kanak-kanak & dewasa. Santai, ikut tahap kau.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis renang.'}},
      {id:'mengaji',label:'Mengaji',key:['mengaji','ngaji','quran','iqra'],
       html:'<b>Mengaji</b> — kelas santai dan sabar, ikut tahap kau. Sesuai untuk yang baru nak mula atau nak perbaiki bacaan.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis mengaji.'}},
      {id:'ajar',label:'Ajar Motor/Kereta',key:['ajar motor','ajar kereta','belajar motor','belajar kereta','driving'],
       html:'<b>Ajar Motor / Kereta</b> — belajar bawa dengan tenang. Fokus pada kawalan, keyakinan & keselamatan.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis ajar motor / kereta.'}},
      {id:'jaga',label:'Jaga Budak',key:['jaga budak','babysit','jaga anak'],
       html:'<b>Jaga Budak</b> — nak keluar, ada majlis atau kerja? Serahkan si kecil pada Iman, dijaga selamat & penuh kasih sayang.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis jaga budak.'}},
      {id:'motor',label:'Joyride Motor Besar',key:['joyride','motor besar','superbike'],
       html:'<b>Joyride Motor Besar</b> — request je nak ke mana, Iman bawa. Kau duduk belakang, nikmati setiap selekoh.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis joyride motor besar.'}},
      {id:'hantar',label:'Hantar',key:['hantar','delivery','ambil hantar'],
       html:'<b>Hantar Ke Mana Sahaja</b> — nak ke kerja, pasar atau kedai? Iman ambil & hantar naik motor. Mudah, laju.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis hantar ke mana sahaja.'}},
      {id:'memasak',label:'Memasak',key:['masak','memasak','cook','pandai masak'],
       html:'<b>Memasak</b> — request menu idaman kau, Iman yang masakkan. Sesuai bila malas masak, ada tetamu, atau nak surprise orang tersayang.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis memasak.'}},
      {id:'teman',label:'Teman Borak',key:['teman','borak','sembang','sleepcall'],
       html:'<b>Teman Borak</b> — nak meluah, cari teman sleepcall, atau borak kosong? Call je Iman. Sedia dengar, tanpa menghakimi.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis teman borak.'}},
      {id:'implant',label:'Implant Gigi',key:['implant','gigi','dental'],
       html:'<b>Implant Gigi</b> — gigi hilang buat segan senyum? Iman bantu <b>aturkan</b> konsultasi & rawatan di klinik pergigian <b>berdaftar</b>. Senyum semula dengan yakin.',cta:{t:'Booking',s:'Hi, saya berminat dengan servis implant gigi.'}},
      {id:'siapa',label:'Siapa Iman?',key:['siapa','who','iman ni','pasal iman'],
       html:'Iman ni orang di sebalik <b>Service by Iman</b>. Satu orang, sepuluh servis peribadi, cover seluruh Malaysia. Suka tolong orang & buat kerja elok!'},
      {id:'hobi',label:'Hobi apa?',key:['hobi','minat','free time','lapang','baca buku'],
       html:'Masa lapang, Iman <b>berenang</b> atau <b>baca buku</b> 📖 Satu cergas badan, satu cergas otak. Kebetulan Renang pun servis dia!'},
      {id:'makan',label:'Suka makan apa?',key:['makan','food','ayam'],
       html:'<b>Ayam goreng for life!</b> 🍗 Iman boleh makan tiap hari pun tak jemu. Minuman pula suka yang masam-masam. Nak ambil hati dia? Belanja ayam goreng.'},
      {id:'random',label:'Fun fact Iman?',key:['fun fact','random','perangai','jenis apa'],
       html:'Iman ni orang paling <b>random</b> 😅 Rasa nak beli dia beli, nak pergi dia pergi, nak makan dia cari sampai jumpa. Tapi dia <b>kuat kerja</b>, jarang nampak dekat rumah.'},
      {id:'kahwin',label:'Dah kahwin?',key:['kahwin','married','couple','awek','girlfriend','bujang','single'],
       html:'Dah kahwin belum? Hmm… 🤫 <b>Rahsia.</b> Kenapa, kau sibuk sangat nak tahu? 😏'},
      {id:'sayang',label:'Sayang aku tak?',key:['sayang','love','cinta','suka aku'],
       html:'Sayang tak? Boleh je sayang… <b>RM100 dulu</b> 😆 Baru confirm.'},
      {id:'staff',label:'Ada staff?',key:['staff','pekerja','team','worker'],
       html:'Ada! Team Iman:<span class="iai-li">🧑‍💼 <b>Wan</b> — marketing</span><span class="iai-li">🎙️ <b>Amran</b> — suara halus</span><span class="iai-li">🪨 <b>Dakmat</b> — batu 8</span>Kecik team, tapi padu!'},
      {id:'kawan',label:'Ada kawan?',key:['kawan','friend','geng','sahabat'],
       html:'Kawan? Iman ni <b>lone ranger</b> 😎 Takde kawan sangat, fokus kerja & bergerak sendiri. Tapi dengan customer mesti mesra!'},
      {id:'kawasan',label:'Kawasan mana?',key:['kawasan','area','lokasi','cover','tempat mana'],
       html:'Iman <b>cover seluruh Malaysia</b>. Bagitau je kau area mana, nanti kita aturkan yang paling sesuai.'},
      {id:'harga',label:'Harga?',key:['harga','price','berapa','kos','bayaran'],
       html:'Harga ikut servis & keperluan kau. Paling tepat, tanya terus Iman — dia bagi harga jelas, tiada caj tersembunyi.',cta:{t:'Tanya harga',s:'Hi, saya nak tanya harga servis Iman.'}}
    ];
    var chipOrder = ['semua','memasak','renang','siapa','hobi','makan','random','kahwin','staff','kawan','harga'];

    var root = document.createElement('div');
    root.className = 'iai';
    root.setAttribute('data-side', 'right');
    root.innerHTML =
      '<div class="iai-closed">' +
        '<div class="iai-nudge">Hai! Saya <b>Iman AI</b>. Nak tanya apa-apa? <button class="iai-x" type="button" aria-label="Tutup">×</button></div>' +
        '<button class="iai-charbtn" type="button" aria-label="Buka Iman AI"><span class="iai-ring"></span><span class="iai-dot"></span><img class="iai-char" src="' + CHAR + '" alt="Iman AI"></button>' +
      '</div>' +
      '<div class="iai-panel iai-hidden" role="dialog" aria-label="Iman AI">' +
        '<div class="iai-head"><div class="iai-av"><img src="' + FACE + '" alt="Iman"></div>' +
          '<div class="iai-who"><div class="iai-nm">Iman <i>AI</i></div><div class="iai-st"><span class="iai-g"></span>Online · Balas segera</div></div>' +
          '<button class="iai-close" type="button" aria-label="Tutup">×</button></div>' +
        '<div class="iai-msgs"></div><div class="iai-chips"></div>' +
        '<form class="iai-form" autocomplete="off"><input type="text" placeholder="Taip soalan kau…" aria-label="Taip soalan"><button class="iai-send" type="submit" aria-label="Hantar">↑</button></form>' +
      '</div>';
    document.body.appendChild(root);

    var closed = root.querySelector('.iai-closed');
    var panel = root.querySelector('.iai-panel');
    var msgs = root.querySelector('.iai-msgs');
    var chipsEl = root.querySelector('.iai-chips');
    var form = root.querySelector('.iai-form');
    var input = form.querySelector('input');
    var history = [];

    function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }
    function stripHtml(html) { var d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').trim(); }
    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function botRow(html, opts) {
      opts = opts || {};
      var row = document.createElement('div'); row.className = 'iai-row iai-bot';
      row.innerHTML = '<div class="iai-ra"><img src="' + FACE + '" alt=""></div>';
      var b = document.createElement('div'); b.className = 'iai-bub'; b.innerHTML = html;
      if (opts.cta) { var a = document.createElement('a'); a.className = 'iai-cta'; a.href = WA + encodeURIComponent(opts.cta.s); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = opts.cta.t; b.appendChild(a); }
      row.appendChild(b); msgs.appendChild(row); scrollDown();
    }
    function meRow(text) { var row = document.createElement('div'); row.className = 'iai-row iai-me'; var b = document.createElement('div'); b.className = 'iai-bub'; b.textContent = text; row.appendChild(b); msgs.appendChild(row); scrollDown(); }
    function typing() { var row = document.createElement('div'); row.className = 'iai-row iai-bot'; row.innerHTML = '<div class="iai-ra"><img src="' + FACE + '" alt=""></div><div class="iai-bub"><span class="iai-typing"><i></i><i></i><i></i></span></div>'; msgs.appendChild(row); scrollDown(); return row; }
    function localAnswer(html, opts) { var t = typing(); window.setTimeout(function () { t.remove(); botRow(html, opts); }, 600); }
    function match(text) { var q = text.toLowerCase(); for (var i = 0; i < replies.length; i++) { for (var j = 0; j < replies[i].key.length; j++) { if (q.indexOf(replies[i].key[j]) > -1) return replies[i]; } } return null; }
    function aiAnswer(text) {
      var t = typing();
      fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, history: history.slice(-6) }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { t.remove(); var reply = (d && d.reply) ? String(d.reply) : 'Cuba tanya lain ya.'; botRow(esc(reply)); history.push({ role: 'assistant', content: reply }); })
        .catch(function () { t.remove(); botRow('Iman AI tengah sibuk. Kau boleh terus WhatsApp Iman:', { cta: { t: 'WhatsApp Iman', s: 'Hi, saya berminat dengan servis Iman.' } }); });
    }
    function handle(text) {
      meRow(text); history.push({ role: 'user', content: text });
      var r = match(text);
      if (r) { localAnswer(r.html, { cta: r.cta }); history.push({ role: 'assistant', content: stripHtml(r.html) }); }
      else { aiAnswer(text); }
    }
    function buildChips() { chipsEl.innerHTML = ''; chipOrder.forEach(function (id) { var r = null; for (var i = 0; i < replies.length; i++) { if (replies[i].id === id) { r = replies[i]; break; } } if (!r) return; var c = document.createElement('button'); c.type = 'button'; c.className = 'iai-chip'; c.textContent = r.label; c.addEventListener('click', function () { handle(r.label); }); chipsEl.appendChild(c); }); }

    var started = false;
    function open() { closed.classList.add('iai-hidden'); panel.classList.remove('iai-hidden'); if (!started) { started = true; localAnswer('Hai! Saya <b>Iman AI</b> 👋 Aku boleh cerita pasal <b>10 servis Iman</b>, tolong kau pilih, malah borak pasal Iman sendiri. Nak mula dari mana?'); buildChips(); } window.setTimeout(function () { try { input.focus(); } catch (e) {} }, 300); }
    function close() { panel.classList.add('iai-hidden'); closed.classList.remove('iai-hidden'); }

    root.querySelector('.iai-charbtn').addEventListener('click', open);
    root.querySelector('.iai-close').addEventListener('click', close);
    root.querySelector('.iai-x').addEventListener('click', function (e) { e.stopPropagation(); var n = root.querySelector('.iai-nudge'); if (n) n.style.display = 'none'; });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value.trim(); if (!v) return; input.value = ''; handle(v); });
  })();
})();
