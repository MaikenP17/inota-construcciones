/* Torre Inota — Stack Game v4 — Viaje al Cosmos
   12 Visual Stages: Ciudad → Atardecer → Hora Azul → Noche → Estratósfera →
                     Mesosfera → Auroras → Órbita → Luna → Planetas → Nebulosa → Cosmos
   Bug fix: passthrough click → dropLocked timer + stopPropagation
*/
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     CONFIG
  ═══════════════════════════════════════════════════ */
  var CONFIG = {
    blockH:        26,
    blockStartW:   270,
    minBlockW:     20,
    speedStart:    1.2,
    speedMax:      3.8,
    perfectThresh: 12,
    perfectBonus:  0,
    cameraLerp:    0.065,
    particleCount: 14,
    dropLockMs:    450,
  };

  /* ═══════════════════════════════════════════════════
     12 STAGES
  ═══════════════════════════════════════════════════ */
  var STAGES = [
    { from: 0,   to: 6,
      label: 'Ciudad',
      skyTop: '#1e2430', skyBot: '#120f0d', cityColor: '#181412',
      sunColor: 'rgba(190,125,55,0.26)', sunX: 0.72, sunY: 0.65, sunR: 130,
      blocks: ['#cec5b8','#b8b0a4','#a89e94','#d8ccbc','#c2b8aa'],
      fogColor: 'rgba(20,16,13,0.68)' },
    { from: 7,   to: 13,
      label: 'Atardecer',
      skyTop: '#3a2010', skyBot: '#1c0e06', cityColor: '#2a1808',
      sunColor: 'rgba(225,110,38,0.32)', sunX: 0.65, sunY: 0.75, sunR: 100,
      blocks: ['#c8955c','#d8aa70','#cc9a6a','#bc864a','#ac7c44'],
      fogColor: 'rgba(28,14,6,0.72)' },
    { from: 14,  to: 22,
      label: 'Hora Azul',
      skyTop: '#131e2c', skyBot: '#090d16', cityColor: '#080e1c',
      sunColor: 'rgba(200,220,255,0.16)', sunX: 0.30, sunY: 0.28, sunR: 55,
      blocks: ['#7888a0','#8898b0','#6878a0','#9aaabf','#8890b0'],
      fogColor: 'rgba(9,13,22,0.75)' },
    { from: 23,  to: 33,
      label: 'Noche',
      skyTop: '#060809', skyBot: '#030405', cityColor: '#050709',
      sunColor: 'rgba(210,225,255,0.14)', sunX: 0.28, sunY: 0.22, sunR: 48,
      blocks: ['#8a9ab0','#9aaabf','#7a8aa0','#aab5c8','#9aaac0'],
      fogColor: 'rgba(5,7,9,0.80)' },
    { from: 34,  to: 46,
      label: 'Estratósfera',
      skyTop: '#060a12', skyBot: '#030508', cityColor: '#050709',
      sunColor: 'rgba(200,225,255,0.10)', sunX: 0.28, sunY: 0.20, sunR: 40,
      blocks: ['#a8b8c8','#c0d0e0','#90a0b0','#b0c0d0','#9aaab8'],
      fogColor: 'rgba(4,6,10,0.82)' },
    { from: 47,  to: 59,
      label: 'Mesosfera',
      skyTop: '#04060c', skyBot: '#020304', cityColor: '#020406',
      sunColor: 'rgba(180,200,255,0.08)', sunX: 0.25, sunY: 0.18, sunR: 36,
      blocks: ['#b0c0d0','#c8d8e8','#98a8b8','#a8b8c8','#b8c8d8'],
      fogColor: 'rgba(3,4,8,0.85)' },
    { from: 60,  to: 76,
      label: 'Auroras',
      skyTop: '#030508', skyBot: '#020304', cityColor: '#020304',
      sunColor: 'rgba(150,180,255,0.06)', sunX: 0.25, sunY: 0.15, sunR: 32,
      blocks: ['#7090c0','#8090d0','#9080c0','#80a0d0','#90a0e0'],
      fogColor: 'rgba(2,3,6,0.88)' },
    { from: 77,  to: 95,
      label: 'Órbita',
      skyTop: '#020408', skyBot: '#010203', cityColor: '#010203',
      sunColor: 'rgba(130,160,255,0.05)', sunX: 0.22, sunY: 0.12, sunR: 28,
      blocks: ['#90b0e0','#a0c0f0','#80a0d0','#b0c8f0','#7898c8'],
      fogColor: 'rgba(1,2,5,0.90)' },
    { from: 96,  to: 113,
      label: 'Luna',
      skyTop: '#010308', skyBot: '#000102', cityColor: '#010102',
      sunColor: 'rgba(220,230,255,0.22)', sunX: 0.62, sunY: 0.25, sunR: 70,
      blocks: ['#c8c8d0','#d8d8e0','#b0b0c0','#e0e0e8','#c0c0ce'],
      fogColor: 'rgba(1,1,4,0.92)' },
    { from: 114, to: 133,
      label: 'Planetas',
      skyTop: '#010208', skyBot: '#000102', cityColor: '#000102',
      sunColor: 'rgba(220,195,155,0.10)', sunX: 0.68, sunY: 0.30, sunR: 55,
      blocks: ['#c0b090','#d0c0a0','#b0a080','#c8b898','#b8a878'],
      fogColor: 'rgba(0,1,4,0.93)' },
    { from: 134, to: 149,
      label: 'Nebulosa',
      skyTop: '#010108', skyBot: '#000102', cityColor: '#000102',
      sunColor: 'rgba(180,140,220,0.06)', sunX: 0.40, sunY: 0.20, sunR: 25,
      blocks: ['#b090d0','#c0a0e0','#d0b0f0','#a080c0','#c8b0e8'],
      fogColor: 'rgba(0,0,3,0.95)' },
    { from: 150, to: 9999,
      label: 'Cosmos',
      skyTop: '#000006', skyBot: '#000001', cityColor: '#000001',
      sunColor: 'rgba(150,130,200,0.04)', sunX: 0.35, sunY: 0.18, sunR: 20,
      blocks: ['#e0e8f8','#f0f0ff','#d8e0f0','#e8f0ff','#d0d8f0'],
      fogColor: 'rgba(0,0,2,0.96)' },
  ];

  function getStage(floor) {
    for (var i = 0; i < STAGES.length; i++) {
      if (floor >= STAGES[i].from && floor <= STAGES[i].to) return STAGES[i];
    }
    return STAGES[STAGES.length - 1];
  }

  /* ═══════════════════════════════════════════════════
     COLOR HELPERS
  ═══════════════════════════════════════════════════ */
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  function rgbToHex(r, g, b) {
    function h(n) { var s = Math.max(0, Math.min(255, Math.round(n))).toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(r) + h(g) + h(b);
  }

  function lightenHex(hex, amt) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r + amt * 255, c.g + amt * 255, c.b + amt * 255);
  }

  function darkenHex(hex, amt) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r - amt * 255, c.g - amt * 255, c.b - amt * 255);
  }

  function lerpColor(hexA, hexB, t) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }

  function smoothstep(edge0, edge1, x) {
    var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function getStageBlend(floor) {
    var cur = getStage(floor);
    var idx = STAGES.indexOf(cur);
    var next = idx < STAGES.length - 1 ? STAGES[idx + 1] : cur;
    var range = Math.max(1, cur.to - cur.from);
    var progress = (floor - cur.from) / range;
    var t = Math.max(0, Math.min(1, (progress - 0.70) / 0.30));
    return { cur: cur, next: next, t: t };
  }

  function getCityAlpha(floor) {
    return Math.max(0, 1 - Math.max(0, floor - 22) / 15);
  }

  /* ═══════════════════════════════════════════════════
     DETERMINISTIC RNG
  ═══════════════════════════════════════════════════ */
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ═══════════════════════════════════════════════════
     CITY LAYERS — 3 parallax depths
  ═══════════════════════════════════════════════════ */
  function genCity(seed, count, minW, maxW, minH, maxH) {
    var rng = makeRng(seed);
    var buildings = [], x = 0;
    var span = count * (minW + maxW) * 0.6;
    while (x < span) {
      var w = minW + Math.floor(rng() * (maxW - minW));
      var h = minH + Math.floor(rng() * (maxH - minH));
      buildings.push({ x: x, w: w, h: h });
      x += w + Math.floor(rng() * 8 + 1);
    }
    return buildings;
  }

  var CITY_FAR  = genCity(42, 90, 10, 30, 15,  85);
  var CITY_MID  = genCity(77, 60, 20, 50, 32, 165);
  var CITY_NEAR = genCity(13, 35, 35, 85, 50, 250);

  function drawCityLayer(ctx, buildings, cw, ch, color, alpha, parallaxY) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = color;
    for (var i = 0; i < buildings.length; i++) {
      var b  = buildings[i];
      var bx = b.x % cw;
      var bh = b.h;
      var by = ch - bh + parallaxY;
      ctx.fillRect(bx, by, b.w, bh + 4);
      if (bx + b.w > cw) ctx.fillRect(bx - cw, by, b.w, bh + 4);
    }
    ctx.globalAlpha = 1;
  }

  /* Window lights */
  var WIN_DATA = (function () {
    var rng = makeRng(55), wins = [];
    for (var i = 0; i < 380; i++) {
      wins.push({ bx: rng(), by: 0.08 + rng() * 0.65, lit: rng() > 0.40,
                  col: (i % 5 === 0) ? '#c8e8ff' : (i % 3 === 0) ? '#ffe0a0' : '#ffd88a' });
    }
    return wins;
  })();

  function drawWindowLights(ctx, cw, ch, alpha) {
    if (alpha <= 0) return;
    var t = Date.now() / 1000;
    for (var i = 0; i < WIN_DATA.length; i++) {
      var w = WIN_DATA[i];
      if (!w.lit) continue;
      var flicker = 0.6 + 0.4 * Math.sin(t * 0.35 + i * 2.3);
      ctx.globalAlpha = alpha * (0.55 + 0.35 * flicker);
      ctx.fillStyle   = w.col;
      ctx.fillRect(w.bx * cw, w.by * ch, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════════
     STARS — twinkling
  ═══════════════════════════════════════════════════ */
  var STAR_DATA = (function () {
    var rng = makeRng(99), stars = [];
    for (var i = 0; i < 200; i++) {
      stars.push({ x: rng(), y: rng() * 0.72, r: 0.4 + rng() * 1.4,
                   a: 0.2 + rng() * 0.75, speed: 0.3 + rng() * 1.2, phase: rng() * Math.PI * 2 });
    }
    return stars;
  })();

  function drawStars(ctx, cw, ch, alpha) {
    if (alpha <= 0) return;
    var t = Date.now() / 1000;
    for (var i = 0; i < STAR_DATA.length; i++) {
      var s = STAR_DATA[i];
      ctx.globalAlpha = s.a * alpha * (0.65 + 0.35 * Math.sin(t * s.speed + s.phase));
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x * cw, s.y * ch, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════════
     CELESTIAL BODIES
  ═══════════════════════════════════════════════════ */
  function drawCelestial(ctx, cw, ch, stage) {
    var cx = stage.sunX * cw, cy = stage.sunY * ch, r = stage.sunR;
    var g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, stage.sunColor);
    g.addColorStop(0.45, stage.sunColor.replace(/[\d.]+\)$/, '0.04)'));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }

  function drawSaturn(ctx, cx, cy, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    // Corona exterior
    var corona = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 3.5);
    corona.addColorStop(0, 'rgba(220,190,140,' + (alpha * 0.10) + ')');
    corona.addColorStop(1, 'transparent');
    ctx.fillStyle = corona;
    ctx.fillRect(-r * 3.5, -r * 3.5, r * 7, r * 7);
    // Planeta — gradiente 3 paradas
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    g.addColorStop(0,   'rgba(235,210,170,' + alpha + ')');
    g.addColorStop(0.5, 'rgba(210,180,130,' + alpha + ')');
    g.addColorStop(1,   'rgba(150,125,90,'  + alpha + ')');
    var rings = [
      { rx: r * 2.5,  ry: r * 0.32, a: alpha * 0.60, lw: r * 0.26 },
      { rx: r * 1.85, ry: r * 0.22, a: alpha * 0.45, lw: r * 0.20 },
      { rx: r * 1.35, ry: r * 0.16, a: alpha * 0.35, lw: r * 0.13 },
    ];
    rings.forEach(function (ring) {
      ctx.strokeStyle = 'rgba(200,175,130,' + ring.a + ')';
      ctx.lineWidth   = ring.lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.rx, ring.ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    // Highlight
    var hl = ctx.createRadialGradient(-r * 0.25, -r * 0.30, 0, -r * 0.25, -r * 0.30, r * 0.35);
    hl.addColorStop(0, 'rgba(255,245,225,' + (alpha * 0.35) + ')');
    hl.addColorStop(1, 'transparent');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    rings.forEach(function (ring) {
      ctx.strokeStyle = 'rgba(200,175,130,' + ring.a + ')';
      ctx.lineWidth   = ring.lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCelestialForStage(ctx, cw, ch, floor, blend) {
    if (floor >= 114 && floor <= 138) {
      var satAlpha = smoothstep(114, 124, floor) * (1 - smoothstep(130, 138, floor));
      drawSaturn(ctx, cw * 0.70, ch * 0.28, Math.min(cw, ch) * 0.09, satAlpha);
    } else {
      drawCelestial(ctx, cw, ch, blend.cur);
    }
  }

  /* ═══════════════════════════════════════════════════
     CLOUDS — slow horizontal drift
  ═══════════════════════════════════════════════════ */
  var CLOUD_DATA = (function () {
    var rng = makeRng(31), clouds = [];
    for (var i = 0; i < 12; i++) {
      clouds.push({
        x: rng() * 1400, y: rng() * 0.40,
        w: 80 + rng() * 220, h: 18 + rng() * 38,
        alpha: 0.06 + rng() * 0.10, speed: 0.08 + rng() * 0.12,
      });
    }
    return clouds;
  })();

  function updateClouds(cw) {
    for (var i = 0; i < CLOUD_DATA.length; i++) {
      CLOUD_DATA[i].x -= CLOUD_DATA[i].speed;
      if (CLOUD_DATA[i].x + CLOUD_DATA[i].w < 0) CLOUD_DATA[i].x = cw + CLOUD_DATA[i].w;
    }
  }

  function drawClouds(ctx, cw, ch, floor) {
    var fade = Math.max(0, 1 - Math.max(0, floor - 18) / 9);
    if (fade <= 0) return;
    for (var i = 0; i < CLOUD_DATA.length; i++) {
      var c = CLOUD_DATA[i];
      ctx.globalAlpha = c.alpha * fade;
      ctx.fillStyle   = '#e8e0d8';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y * ch, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════════
     CONSTRUCTION CRANE
  ═══════════════════════════════════════════════════ */
  function drawCrane(ctx, cw, ch, camY, alpha) {
    if (alpha <= 0) return;
    var parallax = Math.max(0, -camY) * 0.06;
    var bx  = Math.floor(cw * 0.87);
    var top = Math.floor(ch * 0.22) + parallax;

    ctx.save();
    ctx.globalAlpha = 0.20 * alpha;
    ctx.fillStyle   = '#141210';
    ctx.strokeStyle = '#141210';
    ctx.lineWidth   = 3;

    ctx.fillRect(bx, top, 7, ch - top);

    var jibL = Math.floor(cw * 0.13);
    ctx.fillRect(bx - jibL, top + 4, jibL + 7, 5);
    ctx.fillRect(bx + 7, top + 2, Math.floor(cw * 0.04), 10);

    ctx.beginPath();
    ctx.moveTo(bx - jibL + 8, top + 9);
    ctx.lineTo(bx - Math.floor(jibL * 0.6), top + 52 + parallax * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bx - Math.floor(jibL * 0.6), top + 56 + parallax * 0.4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1.5;
    for (var ly = top + 16; ly < ch * 0.6; ly += 28) {
      ctx.beginPath();
      ctx.moveTo(bx, ly);
      ctx.lineTo(bx + 7, ly + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + 7, ly);
      ctx.lineTo(bx, ly + 14);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════
     SPECIAL EFFECTS
  ═══════════════════════════════════════════════════ */

  /* A. Auroras (pisos 60–76) */
  var AURORA_BANDS = [
    { freq: 0.0025, phase: 0.0, amp: 55, yBase: 0.18, color: [60,  220, 140] },
    { freq: 0.0040, phase: 1.6, amp: 75, yBase: 0.26, color: [90,  170, 255] },
    { freq: 0.0030, phase: 3.2, amp: 42, yBase: 0.22, color: [200,  90, 255] },
  ];

  function drawAurora(ctx, cw, ch, floor) {
    var alpha = smoothstep(32, 46, floor) * (1 - smoothstep(62, 72, floor));
    if (alpha <= 0.01) return;
    var t = Date.now() / 1000;
    for (var bi = 0; bi < AURORA_BANDS.length; bi++) {
      var band = AURORA_BANDS[bi];
      ctx.beginPath();
      for (var x = 0; x <= cw; x += 8) {
        var y = band.yBase * ch + Math.sin(x * band.freq + t + band.phase) * band.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + band.color.join(',') + ',' + (alpha * 0.45) + ')';
      ctx.lineWidth   = 34;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(' + band.color.join(',') + ',' + (alpha * 0.70) + ')';
      ctx.lineWidth   = 10;
      ctx.stroke();
    }
  }

  /* B. Earth glow (pisos 77–95) */
  function drawEarthGlow(ctx, cw, ch, floor) {
    var alpha = smoothstep(77, 90, floor) * (1 - smoothstep(92, 100, floor));
    if (alpha <= 0.01) return;
    var g = ctx.createRadialGradient(cw / 2, ch + ch * 0.15, 0, cw / 2, ch + ch * 0.15, cw * 1.1);
    g.addColorStop(0,   'rgba(40,130,255,'  + (alpha * 0.85) + ')');
    g.addColorStop(0.3, 'rgba(20,80,200,'   + (alpha * 0.45) + ')');
    g.addColorStop(1,   'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    var haze = ctx.createLinearGradient(0, ch * 0.55, 0, ch);
    haze.addColorStop(0, 'transparent');
    haze.addColorStop(1, 'rgba(30,100,220,' + (alpha * 0.35) + ')');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, cw, ch);
  }

  /* C. Meteors (pisos 166+) */
  var METEOR_POOL = (function () {
    var rng = makeRng(17), pool = [];
    for (var i = 0; i < 6; i++) {
      pool.push({
        sx: 0.05 + rng() * 0.85,
        sy: 0.02 + rng() * 0.28,
        vx: 0.55 + rng() * 0.45,
        vy: 0.22 + rng() * 0.28,
        length: 55 + Math.floor(rng() * 90),
        speed:  2.2 + rng() * 2.8,
        active: false,
        progress: 0,
        cooldown:    Math.floor(rng() * 100 + 60),
        maxCooldown: Math.floor(rng() * 160 + 110),
      });
    }
    return pool;
  })();

  function updateMeteors(floor) {
    if (floor < 96) return;
    for (var i = 0; i < METEOR_POOL.length; i++) {
      var m = METEOR_POOL[i];
      if (!m.active) {
        m.cooldown--;
        if (m.cooldown <= 0) { m.active = true; m.progress = 0; }
      } else {
        m.progress += m.speed;
        if (m.progress > m.length + 80) { m.active = false; m.cooldown = m.maxCooldown; }
      }
    }
  }

  function drawMeteors(ctx, cw, ch, floor) {
    var alpha = smoothstep(96, 108, floor);
    if (alpha <= 0.01) return;
    for (var i = 0; i < METEOR_POOL.length; i++) {
      var m = METEOR_POOL[i];
      if (!m.active) continue;
      var x1 = m.sx * cw + m.vx * m.progress;
      var y1 = m.sy * ch + m.vy * m.progress;
      var tail = Math.min(m.progress, m.length);
      var x0 = x1 - m.vx * tail, y0 = y1 - m.vy * tail;
      var grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(255,255,255,' + (alpha * 0.40) + ')');
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 4.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      var grad2 = ctx.createLinearGradient(x0, y0, x1, y1);
      grad2.addColorStop(0, 'transparent');
      grad2.addColorStop(1, 'rgba(255,255,255,' + (alpha * 0.90) + ')');
      ctx.strokeStyle = grad2;
      ctx.lineWidth   = 1.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      var headG = ctx.createRadialGradient(x1, y1, 0, x1, y1, 12);
      headG.addColorStop(0, 'rgba(255,255,255,' + (alpha * 0.60) + ')');
      headG.addColorStop(1, 'transparent');
      ctx.fillStyle = headG;
      ctx.fillRect(x1 - 12, y1 - 12, 24, 24);
      ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.90) + ')';
      ctx.beginPath(); ctx.arc(x1, y1, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* D. Nebula patches (pisos 251–305) */
  var NEBULA_PATCHES = [
    { x: 0.25, y: 0.30, r: 0.40, rgb: [180,  80, 255] },
    { x: 0.70, y: 0.20, r: 0.35, rgb: [ 40, 200, 220] },
    { x: 0.50, y: 0.55, r: 0.28, rgb: [255, 160,  60] },
    { x: 0.15, y: 0.60, r: 0.25, rgb: [120,  60, 220] },
    { x: 0.80, y: 0.50, r: 0.30, rgb: [ 60, 220, 180] },
  ];

  function drawNebula(ctx, cw, ch, floor) {
    var alpha = smoothstep(134, 145, floor) * 0.25;
    if (alpha <= 0.005) return;
    var t = Date.now() / 1000;
    for (var i = 0; i < NEBULA_PATCHES.length; i++) {
      var p = NEBULA_PATCHES[i];
      var pulse = 0.85 + 0.15 * Math.sin(t * 0.12 + i * 1.4);
      var r = p.r * Math.min(cw, ch);
      var g = ctx.createRadialGradient(p.x * cw, p.y * ch, 0, p.x * cw, p.y * ch, r);
      g.addColorStop(0, 'rgba(' + p.rgb.join(',') + ',' + (alpha * pulse) + ')');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  /* E. Galaxy band (pisos 306+) */
  function drawGalaxy(ctx, cw, ch, floor) {
    var alpha = smoothstep(136, 148, floor) * 0.22;
    if (alpha <= 0.005) return;
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(-0.35);
    var band = ctx.createLinearGradient(0, -ch * 0.5, 0, ch * 0.5);
    band.addColorStop(0,    'transparent');
    band.addColorStop(0.35, 'rgba(200,190,255,' + alpha + ')');
    band.addColorStop(0.5,  'rgba(220,210,255,' + (alpha * 1.4) + ')');
    band.addColorStop(0.65, 'rgba(200,190,255,' + alpha + ')');
    band.addColorStop(1,    'transparent');
    ctx.fillStyle = band;
    ctx.fillRect(-cw, -ch, cw * 2, ch * 2);
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════
     BACKGROUND
  ═══════════════════════════════════════════════════ */
  function drawBackground(ctx, cw, ch, floor, camY) {
    var blend = getStageBlend(floor);
    var skyTopC = lerpColor(blend.cur.skyTop, blend.next.skyTop, blend.t);
    var skyBotC = lerpColor(blend.cur.skyBot, blend.next.skyBot, blend.t);

    // 1. Sky gradient
    var sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, skyTopC);
    sky.addColorStop(1, skyBotC);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    // 2. Celestial body
    drawCelestialForStage(ctx, cw, ch, floor, blend);

    // 3. Stars (appear from floor 22)
    drawStars(ctx, cw, ch, Math.min(1, Math.max(0, (floor - 22) / 10)));

    // 4. Nebula
    drawNebula(ctx, cw, ch, floor);

    // 5. Galaxy band
    drawGalaxy(ctx, cw, ch, floor);

    // 6. Auroras
    drawAurora(ctx, cw, ch, floor);

    // 7. Earth glow
    drawEarthGlow(ctx, cw, ch, floor);

    // 8. Clouds
    drawClouds(ctx, cw, ch, floor);

    // 9. City layers (fade out pisos 50–80)
    var ca = getCityAlpha(floor);
    if (ca > 0) {
      var scroll = Math.max(0, -camY);
      drawCityLayer(ctx, CITY_FAR,  cw, ch, blend.cur.cityColor, 0.50 * ca, scroll * 0.04);
      drawCityLayer(ctx, CITY_MID,  cw, ch, blend.cur.cityColor, 0.76 * ca, scroll * 0.12);
      drawCityLayer(ctx, CITY_NEAR, cw, ch, blend.cur.cityColor, 0.92 * ca, scroll * 0.24);
      drawWindowLights(ctx, cw, ch, Math.min(0.9, Math.max(0, (floor - 8) / 12) * 0.9) * ca);
    }

    // 10. Ground mist
    var mist = ctx.createLinearGradient(0, ch * 0.68, 0, ch);
    mist.addColorStop(0, 'transparent');
    mist.addColorStop(1, blend.cur.fogColor);
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, cw, ch);

    // 11. Meteors
    drawMeteors(ctx, cw, ch, floor);

    // 12. Crane (fade out pisos 0–34)
    drawCrane(ctx, cw, ch, camY, Math.max(0, 1 - floor / 34));
  }

  /* ═══════════════════════════════════════════════════
     AUDIO SYNTH
  ═══════════════════════════════════════════════════ */
  function AudioSynth() { this.ctx = null; this.ready = false; }

  AudioSynth.prototype._init = function () {
    if (this.ready) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.ready = true; }
    catch (e) {}
  };

  AudioSynth.prototype._sine = function (freq, gain, dur, start, type) {
    if (!this.ready) return;
    var ac = this.ctx, osc = ac.createOscillator(), env = ac.createGain();
    osc.type = type || 'sine'; osc.frequency.value = freq;
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env); env.connect(ac.destination);
    osc.start(start); osc.stop(start + dur + 0.02);
  };

  AudioSynth.prototype._noise = function (gain, dur, start, fc, q) {
    if (!this.ready) return;
    var ac = this.ctx, len = Math.ceil(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(); src.buffer = buf;
    var filt = ac.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.value = fc || 1200; filt.Q.value = q || 0.8;
    var env = ac.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filt); filt.connect(env); env.connect(ac.destination);
    src.start(start); src.stop(start + dur + 0.02);
  };

  AudioSynth.prototype.playLand    = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(90, 0.13, 0.10, t); this._noise(0.09, 0.07, t, 900, 0.6);
  };
  AudioSynth.prototype.playPerfect = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(1047, 0.09, 0.30, t); this._sine(1319, 0.07, 0.28, t + 0.04);
    this._sine(1568, 0.06, 0.24, t + 0.08); this._sine(2093, 0.04, 0.20, t + 0.13);
  };
  AudioSynth.prototype.playCombo   = function (n) {
    this._init(); if (!this.ready) return;
    var base = 523 * Math.pow(1.25, Math.min(n - 2, 6)), t = this.ctx.currentTime;
    this._sine(base, 0.08, 0.22, t); this._sine(base * 1.5, 0.06, 0.20, t + 0.05);
    this._sine(base * 2, 0.04, 0.16, t + 0.10);
  };
  AudioSynth.prototype.playCut     = function (overlap) {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    if (overlap < 20) { this._sine(220, 0.07, 0.14, t); this._sine(180, 0.05, 0.10, t + 0.05); }
    else { this._noise(0.07, 0.07, t, 1600, 1.0); }
  };
  AudioSynth.prototype.playLevelUp = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(330, 0.055, 0.22, t); this._sine(415, 0.045, 0.22, t + 0.10); this._sine(523, 0.038, 0.30, t + 0.20);
  };
  AudioSynth.prototype.playGameOver = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(220, 0.10, 0.80, t); this._sine(165, 0.08, 1.20, t + 0.15);
    this._sine(110, 0.06, 1.80, t + 0.32); this._noise(0.04, 0.28, t, 400, 0.5);
  };
  AudioSynth.prototype.playNewRecord = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(1047, 0.055, 0.45, t);
    this._sine(1319, 0.045, 0.42, t + 0.14);
    this._sine(1568, 0.038, 0.40, t + 0.28);
    this._sine(2093, 0.030, 0.50, t + 0.44);
    this._sine(2637, 0.022, 0.45, t + 0.60);
  };

  /* ═══════════════════════════════════════════════════
     MUSIC ENGINE — Ambient synthesized soundtrack
     4 harmonic groups that evolve with the stage.
     Zero external files — all Web Audio API synthesis.
  ═══════════════════════════════════════════════════ */
  var MUSIC_GROUPS = [
    // 0: City / Architecture (floors 0–39) — Cmaj7, warm & grounded
    { bass: 65.41, mid: 130.81, high: 392.00, bassG: 0.100, midG: 0.070, highG: 0.022 },
    // 1: Atmosphere (floors 40–88) — Fmaj7, cool & ascending
    { bass: 87.31, mid: 174.61, high: 349.23, bassG: 0.090, midG: 0.060, highG: 0.018 },
    // 2: Space (floors 89–150) — Am open fifth, sparse & ethereal
    { bass: 55.00, mid: 110.00, high: 440.00, bassG: 0.080, midG: 0.055, highG: 0.015 },
    // 3: Cosmos (floors 151+)  — D drone, vast & minimal
    { bass: 36.71, mid:  73.42, high: 293.66, bassG: 0.068, midG: 0.046, highG: 0.012 },
  ];

  function getMusicGroup(floor) {
    if (floor < 40)  return 0;
    if (floor < 89)  return 1;
    if (floor < 151) return 2;
    return 3;
  }

  function MusicEngine() {
    this.ctx          = null;
    this.master       = null;
    this.bassOsc1     = null; this.bassOsc2 = null; this.bassGainNode = null;
    this.midOsc1      = null; this.midOsc2  = null; this.midGainNode  = null;
    this.highOsc      = null; this.highLfo  = null; this.highGainNode = null;
    this.group        = -1;
    this.ready        = false;
  }

  MusicEngine.prototype.init = function (ctx) {
    if (this.ready) {
      this.group = -1;
      this._setGroup(0, false);
      this.fadeIn();
      return;
    }
    this.ctx = ctx;

    // Master output
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // Feedback delay (reverb approximation)
    var delay = ctx.createDelay(1.0);
    var fb    = ctx.createGain();
    var wet   = ctx.createGain();
    delay.delayTime.value = 0.42;
    fb.gain.value         = 0.36;
    wet.gain.value        = 0.20;
    delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(this.master);

    // Bass layer — 2 detuned sines through lowpass
    this.bassGainNode = ctx.createGain(); this.bassGainNode.gain.value = 0;
    var bf = ctx.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 320; bf.Q.value = 0.5;
    this.bassOsc1 = ctx.createOscillator(); this.bassOsc1.type = 'sine';     this.bassOsc1.detune.value = -5;
    this.bassOsc2 = ctx.createOscillator(); this.bassOsc2.type = 'triangle'; this.bassOsc2.detune.value = +5;
    this.bassOsc1.connect(bf); this.bassOsc2.connect(bf);
    bf.connect(this.bassGainNode);
    this.bassGainNode.connect(this.master);
    this.bassGainNode.connect(delay);

    // Mid layer — 2 detuned sines through lowpass
    this.midGainNode = ctx.createGain(); this.midGainNode.gain.value = 0;
    var mf = ctx.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 700; mf.Q.value = 0.4;
    this.midOsc1 = ctx.createOscillator(); this.midOsc1.type = 'sine'; this.midOsc1.detune.value = -6;
    this.midOsc2 = ctx.createOscillator(); this.midOsc2.type = 'sine'; this.midOsc2.detune.value = +6;
    this.midOsc1.connect(mf); this.midOsc2.connect(mf);
    mf.connect(this.midGainNode);
    this.midGainNode.connect(this.master);
    this.midGainNode.connect(delay);

    // High shimmer — sine with gentle LFO vibrato
    this.highGainNode = ctx.createGain(); this.highGainNode.gain.value = 0;
    var hf = ctx.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 1400; hf.Q.value = 0.3;
    this.highOsc = ctx.createOscillator(); this.highOsc.type = 'sine';
    this.highLfo = ctx.createOscillator(); this.highLfo.type = 'sine'; this.highLfo.frequency.value = 0.18;
    var lfoG = ctx.createGain(); lfoG.gain.value = 1.8;
    this.highLfo.connect(lfoG); lfoG.connect(this.highOsc.detune);
    this.highOsc.connect(hf); hf.connect(this.highGainNode);
    this.highGainNode.connect(this.master);
    this.highGainNode.connect(delay);

    // Initialize frequencies to group 0
    var g0 = MUSIC_GROUPS[0];
    this.bassOsc1.frequency.value = g0.bass; this.bassOsc2.frequency.value = g0.bass;
    this.midOsc1.frequency.value  = g0.mid;  this.midOsc2.frequency.value  = g0.mid;
    this.highOsc.frequency.value  = g0.high;

    var oscs = [this.bassOsc1, this.bassOsc2, this.midOsc1, this.midOsc2, this.highOsc, this.highLfo];
    oscs.forEach(function (o) { o.start(); });

    this.ready = true;
    this.group = 0;
    this._setGroup(0, true);
    this.fadeIn();
  };

  MusicEngine.prototype._setGroup = function (idx, instant) {
    if (!this.ready) return;
    var g   = MUSIC_GROUPS[idx];
    var t   = this.ctx.currentTime;
    var ftc = instant ? 0.001 : 5.5;
    var gtc = instant ? 0.001 : 3.0;
    this.bassOsc1.frequency.setTargetAtTime(g.bass, t, ftc);
    this.bassOsc2.frequency.setTargetAtTime(g.bass, t, ftc);
    this.midOsc1.frequency.setTargetAtTime(g.mid,   t, ftc);
    this.midOsc2.frequency.setTargetAtTime(g.mid,   t, ftc);
    this.highOsc.frequency.setTargetAtTime(g.high,  t, ftc);
    this.bassGainNode.gain.setTargetAtTime(g.bassG, t, gtc);
    this.midGainNode.gain.setTargetAtTime(g.midG,   t, gtc);
    this.highGainNode.gain.setTargetAtTime(g.highG, t, gtc);
  };

  MusicEngine.prototype.update = function (floor) {
    if (!this.ready) return;
    var grp = getMusicGroup(floor);
    if (grp !== this.group) { this.group = grp; this._setGroup(grp, false); }
  };

  MusicEngine.prototype.fadeIn = function () {
    if (!this.master) return;
    var t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.28, t, 2.2);
  };

  MusicEngine.prototype.fadeOut = function () {
    if (!this.master) return;
    var t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.0, t, 1.4);
  };

  /* ═══════════════════════════════════════════════════
     PARTICLE SYSTEM
  ═══════════════════════════════════════════════════ */
  var PT = { CUT: 0, PERFECT: 1, DEBRIS: 2 };

  function Particle(x, y, vx, vy, color, size, decay, type) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size; this.decay = decay;
    this.life = 1.0; this.type = type;
  }

  function ParticleSystem() { this.list = []; }

  ParticleSystem.prototype.emitCut = function (x, y, color, n) {
    for (var i = 0; i < n; i++)
      this.list.push(new Particle(x, y, (Math.random() - 0.5) * 6, (Math.random() - 1.2) * 3.5,
        color, 1.5 + Math.random() * 3, 0.022 + Math.random() * 0.02, PT.CUT));
  };

  ParticleSystem.prototype.emitPerfect = function (x, y, w, color) {
    var n = Math.floor(w / 7) + 10;
    for (var i = 0; i < n; i++)
      this.list.push(new Particle(
        x + Math.random() * w, y,
        (Math.random() - 0.5) * 2, -(0.6 + Math.random() * 2.2),
        Math.random() > 0.5 ? '#c8a060' : color,
        1.5 + Math.random() * 2.5, 0.012 + Math.random() * 0.01, PT.PERFECT));
  };

  ParticleSystem.prototype.emitDebris = function (x, y, w, color) {
    for (var i = 0; i < 22; i++)
      this.list.push(new Particle(
        x + Math.random() * w, y,
        (Math.random() - 0.5) * 9, -(1 + Math.random() * 4.5),
        color, 3 + Math.random() * 6, 0.014 + Math.random() * 0.012, PT.DEBRIS));
  };

  ParticleSystem.prototype.update = function () {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += p.type === PT.DEBRIS ? 0.25 : 0.09;
      p.life -= p.decay;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  };

  ParticleSystem.prototype.draw = function (ctx, camY) {
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      ctx.globalAlpha = p.life * (p.type === PT.PERFECT ? 0.9 : 1.0);
      ctx.fillStyle   = p.color;
      ctx.fillRect(p.x - p.size / 2, (p.y - camY) - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };

  /* ═══════════════════════════════════════════════════
     FLOATING TEXTS
  ═══════════════════════════════════════════════════ */
  var floatingTexts = [];

  function addFloatingText(text, x, y, color) {
    floatingTexts.push({ text: text, x: x, y: y, vy: -1.4, alpha: 1.0, color: color || '#c8a060' });
  }

  function updateFloatingTexts() {
    for (var i = floatingTexts.length - 1; i >= 0; i--) {
      var ft = floatingTexts[i];
      ft.y    += ft.vy;
      ft.alpha -= 0.018;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
  }

  function drawFloatingTexts(ctx, camY) {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < floatingTexts.length; i++) {
      var ft = floatingTexts[i];
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle   = ft.color;
      ctx.font        = '500 11px Jost, Arial';
      ctx.letterSpacing = '0.18em';
      ctx.fillText(ft.text, ft.x, ft.y - camY);
    }
    ctx.globalAlpha  = 1;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = '0';
  }

  /* ═══════════════════════════════════════════════════
     BLOCK — 3D isometric style
  ═══════════════════════════════════════════════════ */
  var FACE_TOP_H  = 7;
  var FACE_SIDE_W = 6;

  function Block(x, y, w, color) {
    this.x         = x;
    this.y         = y;
    this.w         = w;
    this.h         = CONFIG.blockH;
    this.color     = color;
    this.glowTimer = 0;
    this._light    = lightenHex(color, 0.25);
    this._dark     = darkenHex(color, 0.28);
  }

  Block.prototype.draw = function (ctx, camY) {
    var dy = this.y - camY;
    var x  = this.x, w = this.w, h = this.h;

    ctx.fillStyle = this._light;
    ctx.beginPath();
    ctx.moveTo(x, dy);
    ctx.lineTo(x + w, dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this._dark;
    ctx.beginPath();
    ctx.moveTo(x + w, dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H + h);
    ctx.lineTo(x + w, dy + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.fillRect(x, dy, w, h);

    if (w > 22) {
      var winSpacing = 12, winH = Math.floor(h * 0.52), winY = dy + Math.floor(h * 0.22);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (var wx = x + 9; wx < x + w - 7; wx += winSpacing) ctx.fillRect(wx, winY, 2, winH);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 2, dy + Math.floor(h * 0.52), w - 4, 1);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x, dy, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, dy + h - 2, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x + 4, dy + h, w - 4, 5);

    if (this.glowTimer > 0) {
      ctx.globalAlpha = this.glowTimer * 0.60;
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x + 1, dy + 1, w - 2, h - 2);
      ctx.fillStyle = 'rgba(200,160,96,0.09)';
      ctx.fillRect(x + 2, dy + 2, w - 4, h - 4);
      ctx.globalAlpha = 1;
      this.glowTimer -= 0.022;
      if (this.glowTimer < 0) this.glowTimer = 0;
    }
  };

  /* ═══════════════════════════════════════════════════
     MOVING BLOCK
  ═══════════════════════════════════════════════════ */
  function MovingBlock(y, w, speed, dir, color, cw) {
    this.x       = dir === 1 ? -w : cw;
    this.y       = y;
    this.w       = w;
    this.h       = CONFIG.blockH;
    this.speed   = speed;
    this.dir     = dir;
    this.color   = color;
    this.canvasW = cw;
    this._light  = lightenHex(color, 0.22);
    this._dark   = darkenHex(color, 0.25);
  }

  MovingBlock.prototype.update = function () {
    this.x += this.speed * this.dir;
    if (this.x <= 0)                     { this.dir =  1; this.x = 0; }
    if (this.x + this.w >= this.canvasW) { this.dir = -1; this.x = this.canvasW - this.w; }
  };

  MovingBlock.prototype.draw = function (ctx, camY) {
    var dy = this.y - camY;
    var x  = this.x, w = this.w, h = this.h;

    ctx.fillStyle = this._light;
    ctx.beginPath();
    ctx.moveTo(x, dy);
    ctx.lineTo(x + w, dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this._dark;
    ctx.beginPath();
    ctx.moveTo(x + w, dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H + h);
    ctx.lineTo(x + w, dy + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.fillRect(x, dy, w, h);

    if (w > 22) {
      var spacing = 12, winH = Math.floor(h * 0.52), winY = dy + Math.floor(h * 0.22);
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (var wx = x + 9; wx < x + w - 7; wx += spacing) ctx.fillRect(wx, winY, 2, winH);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fillRect(x, dy, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x, dy + h - 2, w, 2);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x + 0.5, dy + 0.5, w - 1, h - 1);
  };

  /* ═══════════════════════════════════════════════════
     CANVAS
  ═══════════════════════════════════════════════════ */
  var canvas  = document.getElementById('game-canvas');
  var ctx     = canvas.getContext('2d');
  var canvasW = 0, canvasH = 0;

  function resizeCanvas() {
    canvasW = canvas.width  = window.innerWidth;
    canvasH = canvas.height = window.innerHeight;
    if (movingBlock) movingBlock.canvasW = canvasW;
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  /* ═══════════════════════════════════════════════════
     GAME STATE
  ═══════════════════════════════════════════════════ */
  var state        = 'start';
  var tower        = [];
  var movingBlock  = null;
  var score        = 0;
  var combo        = 0;
  var comboTimerID = null;
  var cameraY      = 0;
  var cameraTarget = 0;
  var particles    = new ParticleSystem();
  var audio        = new AudioSynth();
  var music        = new MusicEngine();
  var currentStage = STAGES[0];
  var prevAtmLabel = '';
  var rafId        = null;

  var shakeX = 0, shakeY = 0;
  var slowMoFrames = 0;
  var prevMovingX  = 0;
  var dropLocked   = false;

  /* ═══════════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════════ */
  var screenStart  = document.getElementById('screen-start');
  var screenOver   = document.getElementById('screen-over');
  var hud          = document.getElementById('hud');
  var scoreDisplay = document.getElementById('score-display');
  var bestDisplay  = document.getElementById('best-display');
  var finalScore   = document.getElementById('final-score');
  var overLabel    = document.getElementById('over-label');
  var overReason   = document.getElementById('over-reason');
  var overBestMsg  = document.getElementById('over-best-msg');
  var comboBadge   = document.getElementById('combo-display');
  var comboNum     = document.getElementById('combo-num');
  var atmLabel     = document.getElementById('atm-label');
  var btnStart     = document.getElementById('btn-start');
  var btnRetry     = document.getElementById('btn-retry');

  /* ═══════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════ */
  function getBest() { return parseInt(localStorage.getItem('toreinota_best') || '0', 10); }
  function setBest(n) { localStorage.setItem('toreinota_best', String(n)); }

  function getBlockColor(floor) {
    var stage = getStage(floor);
    return stage.blocks[floor % stage.blocks.length];
  }

  function getSpeed(floor) {
    var t = Math.min(floor / 140, 1);
    return CONFIG.speedStart + t * t * (3 - 2 * t) * (CONFIG.speedMax - CONFIG.speedStart);
  }

  function getPerfectThresh(floor) {
    return CONFIG.perfectThresh + Math.min(6, Math.floor(floor / 20));
  }

  function addShake(intensity) {
    shakeX = (Math.random() - 0.5) * intensity * 2;
    shakeY = (Math.random() - 0.5) * intensity * 2;
  }

  function showCombo(n) {
    comboNum.textContent = n;
    comboBadge.classList.remove('hidden');
    void comboBadge.offsetWidth;
    comboBadge.classList.add('is-visible');
    clearTimeout(comboTimerID);
    comboTimerID = setTimeout(function () {
      comboBadge.classList.remove('is-visible');
      setTimeout(function () { comboBadge.classList.add('hidden'); }, 250);
    }, 1400);
  }

  function triggerPerfectFlash() {
    var el = document.createElement('div');
    el.className = 'perfect-flash';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  }

  function bounceScore() {
    scoreDisplay.classList.remove('bouncing');
    void scoreDisplay.offsetWidth;
    scoreDisplay.classList.add('bouncing');
    setTimeout(function () { scoreDisplay.classList.remove('bouncing'); }, 420);
  }

  /* ═══════════════════════════════════════════════════
     GAME INIT
  ═══════════════════════════════════════════════════ */
  function startGame() {
    dropLocked = true;
    setTimeout(function () { dropLocked = false; }, CONFIG.dropLockMs);

    tower        = [];
    score        = 0;
    combo        = 0;
    cameraY      = 0;
    cameraTarget = 0;
    currentStage = STAGES[0];
    particles    = new ParticleSystem();
    floatingTexts.length = 0;
    shakeX = 0; shakeY = 0;
    slowMoFrames = 0;
    prevMovingX  = 0;

    // Reset meteors
    for (var i = 0; i < METEOR_POOL.length; i++) {
      METEOR_POOL[i].active = false;
      METEOR_POOL[i].progress = 0;
    }

    screenStart.classList.add('hidden');
    screenOver.classList.add('hidden');
    hud.classList.remove('hidden');
    comboBadge.classList.add('hidden');
    comboBadge.classList.remove('is-visible');

    scoreDisplay.textContent = '0';
    bestDisplay.textContent  = String(getBest());
    atmLabel.textContent     = '';
    prevAtmLabel             = '';

    var fw  = Math.min(CONFIG.blockStartW, canvasW - 60);
    var fx  = (canvasW - fw) / 2;
    var fy  = canvasH * 0.72;
    tower.push(new Block(fx, fy, fw, getBlockColor(0)));

    cameraTarget = fy - canvasH * 0.42;
    cameraY      = cameraTarget;

    spawnMoving();
    state = 'playing';
  }

  function spawnMoving() {
    var top   = tower[tower.length - 1];
    var floor = tower.length;
    var dir   = (floor % 2 === 0) ? 1 : -1;
    movingBlock = new MovingBlock(top.y - CONFIG.blockH, top.w, getSpeed(floor), dir, getBlockColor(floor), canvasW);
    prevMovingX = movingBlock.x;
  }

  /* ═══════════════════════════════════════════════════
     DROP LOGIC
  ═══════════════════════════════════════════════════ */
  function dropBlock() {
    if (dropLocked || state !== 'playing' || !movingBlock) return;
    audio._init();

    var top  = tower[tower.length - 1];
    var mx   = movingBlock.x, mw = movingBlock.w;
    var tx   = top.x,         tw = top.w;

    var overlapStart = Math.max(mx, tx);
    var overlapEnd   = Math.min(mx + mw, tx + tw);
    var overlap      = overlapEnd - overlapStart;

    if (overlap <= 0) {
      audio.playGameOver();
      addShake(5);
      particles.emitDebris(mx, movingBlock.y, mw, movingBlock.color);
      triggerGameOver('miss');
      return;
    }

    var isPerfect = overlap >= mw - getPerfectThresh(score);

    var placedX, placedW;
    if (isPerfect) {
      placedX = tx;
      placedW = tw;
    } else {
      placedX = overlapStart;
      placedW = overlap;
    }

    if (!isPerfect && placedW < CONFIG.minBlockW) {
      audio.playGameOver();
      addShake(5);
      particles.emitDebris(placedX, movingBlock.y, placedW, movingBlock.color);
      triggerGameOver('narrow');
      return;
    }

    var newBlock = new Block(placedX, movingBlock.y, placedW, movingBlock.color);
    tower.push(newBlock);
    score++;

    if (isPerfect) {
      combo++;
      newBlock.glowTimer = 1.0;
      slowMoFrames = 9;
      addShake(1.5);
      audio.playPerfect();
      triggerPerfectFlash();
      particles.emitPerfect(placedX, movingBlock.y, placedW, movingBlock.color);
      bounceScore();
      addFloatingText('PERFECTO', placedX + placedW / 2, movingBlock.y - 12 - cameraY + cameraY, '#c8a060');
      if (combo >= 2) {
        showCombo(combo);
        audio.playCombo(combo);
        addFloatingText('×' + combo, placedX + placedW / 2, movingBlock.y - 32 - cameraY + cameraY, '#d4b878');
      }
    } else {
      combo = 0;
      addShake(2.5);
      audio.playCut(overlap);
      var cutX = (mx < tx) ? tx : mx + mw;
      particles.emitCut(cutX, movingBlock.y, movingBlock.color, CONFIG.particleCount);
      bounceScore();
    }

    scoreDisplay.textContent = String(score);
    music.update(score);

    // Stage transition label
    var newStage = getStage(score);
    if (newStage !== currentStage) {
      currentStage = newStage;
      if (currentStage.label !== prevAtmLabel) {
        prevAtmLabel = currentStage.label;
        atmLabel.style.opacity = '1';
        atmLabel.textContent   = currentStage.label;
        audio.playLevelUp();
        clearTimeout(atmLabel._timer);
        atmLabel._timer = setTimeout(function () { atmLabel.style.opacity = '0'; }, 2600);
      }
    }

    cameraTarget = newBlock.y - canvasH * 0.42;
    spawnMoving();
  }

  /* ═══════════════════════════════════════════════════
     GAME OVER
  ═══════════════════════════════════════════════════ */
  function triggerGameOver(reason) {
    state = 'over'; movingBlock = null;
    var best = getBest(), isNew = score > best;
    if (isNew) setBest(score);

    music.fadeOut();
    if (isNew) setTimeout(function () { audio.playNewRecord(); }, 500);

    hud.classList.add('hidden');
    comboBadge.classList.add('hidden');

    finalScore.textContent = String(score);
    overLabel.textContent  = 'Partida terminada';
    overReason.textContent = reason === 'miss' ? 'El bloque no alcanzó la torre' : 'El bloque fue demasiado estrecho';
    overBestMsg.classList.toggle('hidden', !isNew);

    screenOver.classList.remove('hidden');
    void screenOver.offsetWidth;
  }

  /* ═══════════════════════════════════════════════════
     CAMERA
  ═══════════════════════════════════════════════════ */
  function updateCamera() {
    cameraY += (cameraTarget - cameraY) * CONFIG.cameraLerp;
    shakeX *= 0.58;
    shakeY *= 0.58;
    if (Math.abs(shakeX) < 0.05) shakeX = 0;
    if (Math.abs(shakeY) < 0.05) shakeY = 0;
  }

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  function render() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(Math.round(shakeX), Math.round(shakeY));

    drawBackground(ctx, canvasW, canvasH, score, cameraY);

    for (var i = 0; i < tower.length; i++) tower[i].draw(ctx, cameraY);

    if (movingBlock && state === 'playing') {
      ctx.globalAlpha = 0.10;
      ctx.fillStyle   = movingBlock.color;
      ctx.fillRect(prevMovingX, movingBlock.y - cameraY, movingBlock.w, movingBlock.h);
      ctx.globalAlpha = 1;
      movingBlock.draw(ctx, cameraY);
    }

    particles.draw(ctx, cameraY);
    drawFloatingTexts(ctx, cameraY);

    if (state === 'playing' && tower.length > 1) {
      var topB = tower[tower.length - 1];
      var ty   = topB.y - cameraY + topB.h;
      var cx   = topB.x + topB.w / 2;
      var glow = ctx.createRadialGradient(cx, ty, 0, cx, ty, topB.w);
      glow.addColorStop(0, 'rgba(200,160,96,0.07)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(topB.x - topB.w, ty - 10, topB.w * 3, topB.w * 2);
    }

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════
     GAME LOOP
  ═══════════════════════════════════════════════════ */
  function loop() {
    if (state === 'playing') {
      if (movingBlock) {
        if (slowMoFrames > 0) {
          var origSpeed = movingBlock.speed;
          movingBlock.speed = origSpeed * 0.25;
          movingBlock.update();
          movingBlock.speed = origSpeed;
          slowMoFrames--;
        } else {
          movingBlock.update();
        }
        prevMovingX = movingBlock.x;
      }
      updateCamera();
      particles.update();
      updateFloatingTexts();
      updateClouds(canvasW);
      updateMeteors(score);
    } else if (state === 'over') {
      updateCamera();
      particles.update();
      updateFloatingTexts();
      updateMeteors(score);
    }
    render();
    rafId = requestAnimationFrame(loop);
  }

  /* ═══════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if ((e.code === 'Space' || e.code === 'ArrowDown') && state === 'playing') {
      e.preventDefault(); dropBlock();
    }
  });

  canvas.addEventListener('click', function () {
    if (state === 'playing') dropBlock();
  });

  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    if (state === 'playing') dropBlock();
  }, { passive: false });

  btnStart.addEventListener('click', function (e) {
    e.stopPropagation();
    audio._init();
    if (audio.ready) music.init(audio.ctx);
    startGame();
    if (!rafId) loop();
  });

  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    if (audio.ready) music.init(audio.ctx);
    startGame();
  });

  loop();

})();
