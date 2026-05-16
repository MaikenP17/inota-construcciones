/* Torre Inota — Stack Game v3
   Vanilla JS · Canvas 2D · Sin dependencias
   Bug fix: passthrough click → dropLocked timer + stopPropagation
   Visual juice: camera shake, slow-mo perfect, floating texts, 3D blocks,
                 clouds, crane, ghost trail, window lights
*/
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     CONFIG
  ═══════════════════════════════════════════════════ */
  var CONFIG = {
    blockH:        26,
    blockStartW:   270,
    minBlockW:     20,      // game over solo en fallos muy claros
    speedStart:    1.2,
    speedMax:      5.0,
    perfectThresh: 18,      // zona de snap generosa (era 7)
    perfectBonus:  3,
    cameraLerp:    0.065,
    particleCount: 14,
    dropLockMs:    450,     // ms de protección tras pulsar Start/Retry
  };

  /* ═══════════════════════════════════════════════════
     ATMOSPHERES
  ═══════════════════════════════════════════════════ */
  var ATMOSPHERES = [
    { from: 0,  to: 12,   label: 'Amanecer',
      skyTop: '#1e1c19', skyBot: '#120f0d', cityColor: '#181412',
      sunColor: 'rgba(190,125,55,0.26)', sunX: 0.72, sunY: 0.65, sunR: 130,
      blocks: ['#cec5b8','#b8b0a4','#a89e94','#d8ccbc','#c2b8aa'],
      fogColor: 'rgba(20,16,13,0.68)' },
    { from: 13, to: 25,   label: 'Atardecer',
      skyTop: '#3a2010', skyBot: '#1c0e06', cityColor: '#2a1808',
      sunColor: 'rgba(225,110,38,0.32)', sunX: 0.65, sunY: 0.75, sunR: 100,
      blocks: ['#c8955c','#bc864a','#d8aa70','#cc9a6a','#ac7c44'],
      fogColor: 'rgba(28,14,6,0.72)' },
    { from: 26, to: 40,   label: 'Crepúsculo',
      skyTop: '#131e2c', skyBot: '#090d16', cityColor: '#080e1c',
      sunColor: 'rgba(200,220,255,0.16)', sunX: 0.30, sunY: 0.28, sunR: 55,
      blocks: ['#8a9ab0','#7a8a9f','#6a7a8e','#9aaabf','#7a8aaa'],
      fogColor: 'rgba(9,13,22,0.75)' },
    { from: 41, to: 9999, label: 'Noche',
      skyTop: '#060809', skyBot: '#030405', cityColor: '#050709',
      sunColor: 'rgba(210,225,255,0.12)', sunX: 0.28, sunY: 0.22, sunR: 44,
      blocks: ['#b8c4d4','#d4dae8','#a8b4c4','#c8d0e0','#9aaac0'],
      fogColor: 'rgba(5,7,9,0.80)' },
  ];

  function getAtmosphere(floor) {
    for (var i = 0; i < ATMOSPHERES.length; i++) {
      if (floor >= ATMOSPHERES[i].from && floor <= ATMOSPHERES[i].to) return ATMOSPHERES[i];
    }
    return ATMOSPHERES[ATMOSPHERES.length - 1];
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
    function h(n) { var s = Math.max(0, Math.min(255, Math.round(n))).toString(16); return s.length < 2 ? '0'+s : s; }
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

  /* ── Window lights ── */
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
     CELESTIAL BODY
  ═══════════════════════════════════════════════════ */
  function drawCelestial(ctx, cw, ch, atm) {
    var cx = atm.sunX * cw, cy = atm.sunY * ch, r = atm.sunR;
    var g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, atm.sunColor);
    g.addColorStop(0.45, atm.sunColor.replace(/[\d.]+\)$/, '0.04)'));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
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
  function drawCrane(ctx, cw, ch, camY) {
    var parallax = Math.max(0, -camY) * 0.06;
    var bx  = Math.floor(cw * 0.87);
    var top = Math.floor(ch * 0.22) + parallax;

    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.fillStyle   = '#141210';
    ctx.strokeStyle = '#141210';
    ctx.lineWidth   = 3;

    // Vertical mast
    ctx.fillRect(bx, top, 7, ch - top);

    // Horizontal jib (left side)
    var jibL = Math.floor(cw * 0.13);
    ctx.fillRect(bx - jibL, top + 4, jibL + 7, 5);

    // Counterweight (right)
    ctx.fillRect(bx + 7, top + 2, Math.floor(cw * 0.04), 10);

    // Hoist rope (diagonal to hook)
    ctx.beginPath();
    ctx.moveTo(bx - jibL + 8, top + 9);
    ctx.lineTo(bx - Math.floor(jibL * 0.6), top + 52 + parallax * 0.4);
    ctx.stroke();

    // Hook
    ctx.beginPath();
    ctx.arc(bx - Math.floor(jibL * 0.6), top + 56 + parallax * 0.4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Lattice diagonal on mast (decorative)
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
     BACKGROUND
  ═══════════════════════════════════════════════════ */
  function drawBackground(ctx, cw, ch, floor, atm, camY) {
    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, atm.skyTop);
    sky.addColorStop(1, atm.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    drawCelestial(ctx, cw, ch, atm);

    // Stars
    drawStars(ctx, cw, ch, Math.min(1, Math.max(0, (floor - 22) / 10)));

    // Clouds
    drawClouds(ctx, cw, ch, floor);

    // Parallax city layers
    var scroll = Math.max(0, -camY);
    drawCityLayer(ctx, CITY_FAR,  cw, ch, atm.cityColor, 0.50, scroll * 0.04);
    drawCityLayer(ctx, CITY_MID,  cw, ch, atm.cityColor, 0.76, scroll * 0.12);
    drawCityLayer(ctx, CITY_NEAR, cw, ch, atm.cityColor, 0.92, scroll * 0.24);

    // Window lights — visible from floor 8
    drawWindowLights(ctx, cw, ch, Math.min(0.9, Math.max(0, (floor - 8) / 12) * 0.9));

    // Ground mist
    var mist = ctx.createLinearGradient(0, ch * 0.68, 0, ch);
    mist.addColorStop(0, 'transparent');
    mist.addColorStop(1, atm.fogColor);
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, cw, ch);

    // Crane (after city, before tower)
    drawCrane(ctx, cw, ch, camY);
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

  AudioSynth.prototype.playLand   = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(90, 0.13, 0.10, t); this._noise(0.09, 0.07, t, 900, 0.6);
  };
  AudioSynth.prototype.playPerfect = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(1047, 0.09, 0.30, t); this._sine(1319, 0.07, 0.28, t+0.04);
    this._sine(1568, 0.06, 0.24, t+0.08); this._sine(2093, 0.04, 0.20, t+0.13);
  };
  AudioSynth.prototype.playCombo  = function (n) {
    this._init(); if (!this.ready) return;
    var base = 523 * Math.pow(1.25, Math.min(n - 2, 6)), t = this.ctx.currentTime;
    this._sine(base, 0.08, 0.22, t); this._sine(base*1.5, 0.06, 0.20, t+0.05);
    this._sine(base*2, 0.04, 0.16, t+0.10);
  };
  AudioSynth.prototype.playCut    = function (overlap) {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    if (overlap < 20) { this._sine(220, 0.07, 0.14, t); this._sine(180, 0.05, 0.10, t+0.05); }
    else { this._noise(0.07, 0.07, t, 1600, 1.0); }
  };
  AudioSynth.prototype.playLevelUp = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(330, 0.055, 0.22, t); this._sine(415, 0.045, 0.22, t+0.10); this._sine(523, 0.038, 0.30, t+0.20);
  };
  AudioSynth.prototype.playGameOver = function () {
    this._init(); if (!this.ready) return;
    var t = this.ctx.currentTime;
    this._sine(220, 0.10, 0.80, t); this._sine(165, 0.08, 1.20, t+0.15);
    this._sine(110, 0.06, 1.80, t+0.32); this._noise(0.04, 0.28, t, 400, 0.5);
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
      this.list.push(new Particle(x, y, (Math.random()-0.5)*6, (Math.random()-1.2)*3.5,
        color, 1.5+Math.random()*3, 0.022+Math.random()*0.02, PT.CUT));
  };

  ParticleSystem.prototype.emitPerfect = function (x, y, w, color) {
    var n = Math.floor(w / 7) + 10;
    for (var i = 0; i < n; i++)
      this.list.push(new Particle(
        x + Math.random() * w, y,
        (Math.random()-0.5)*2, -(0.6+Math.random()*2.2),
        Math.random() > 0.5 ? '#c8a060' : color,
        1.5+Math.random()*2.5, 0.012+Math.random()*0.01, PT.PERFECT));
  };

  ParticleSystem.prototype.emitDebris = function (x, y, w, color) {
    for (var i = 0; i < 22; i++)
      this.list.push(new Particle(
        x + Math.random() * w, y,
        (Math.random()-0.5)*9, -(1+Math.random()*4.5),
        color, 3+Math.random()*6, 0.014+Math.random()*0.012, PT.DEBRIS));
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
      ctx.fillRect(p.x - p.size/2, (p.y - camY) - p.size/2, p.size, p.size);
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
  var FACE_TOP_H  = 7;   // height of top face
  var FACE_SIDE_W = 6;   // width offset of side face

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

    // ── Top face (parallelogram) ──
    ctx.fillStyle = this._light;
    ctx.beginPath();
    ctx.moveTo(x,                dy);
    ctx.lineTo(x + w,            dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + FACE_SIDE_W,    dy - FACE_TOP_H);
    ctx.closePath();
    ctx.fill();

    // ── Right face ──
    ctx.fillStyle = this._dark;
    ctx.beginPath();
    ctx.moveTo(x + w,               dy);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H);
    ctx.lineTo(x + w + FACE_SIDE_W, dy - FACE_TOP_H + h);
    ctx.lineTo(x + w,               dy + h);
    ctx.closePath();
    ctx.fill();

    // ── Front face ──
    ctx.fillStyle = this.color;
    ctx.fillRect(x, dy, w, h);

    // ── Window columns ──
    if (w > 22) {
      var winSpacing = 12, winH = Math.floor(h * 0.52), winY = dy + Math.floor(h * 0.22);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (var wx = x + 9; wx < x + w - 7; wx += winSpacing) {
        ctx.fillRect(wx, winY, 2, winH);
      }
      // Horizontal floor line (mid-building)
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 2, dy + Math.floor(h * 0.52), w - 4, 1);
    }

    // ── Highlight top edge ──
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x, dy, w, 2);

    // ── Shadow bottom ──
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, dy + h - 2, w, 2);

    // ── Drop shadow under block ──
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x + 4, dy + h, w - 4, 5);

    // ── Perfect glow ──
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

    // Top face
    ctx.fillStyle = this._light;
    ctx.beginPath();
    ctx.moveTo(x, dy);
    ctx.lineTo(x+w, dy);
    ctx.lineTo(x+w+FACE_SIDE_W, dy-FACE_TOP_H);
    ctx.lineTo(x+FACE_SIDE_W, dy-FACE_TOP_H);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = this._dark;
    ctx.beginPath();
    ctx.moveTo(x+w, dy);
    ctx.lineTo(x+w+FACE_SIDE_W, dy-FACE_TOP_H);
    ctx.lineTo(x+w+FACE_SIDE_W, dy-FACE_TOP_H+h);
    ctx.lineTo(x+w, dy+h);
    ctx.closePath();
    ctx.fill();

    // Front face
    ctx.fillStyle = this.color;
    ctx.fillRect(x, dy, w, h);

    if (w > 22) {
      var spacing = 12, winH = Math.floor(h*0.52), winY = dy + Math.floor(h*0.22);
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (var wx = x+9; wx < x+w-7; wx += spacing) ctx.fillRect(wx, winY, 2, winH);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fillRect(x, dy, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x, dy+h-2, w, 2);

    // Tracking outline
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x+0.5, dy+0.5, w-1, h-1);
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
  var currentAtm   = ATMOSPHERES[0];
  var prevAtmLabel = '';
  var rafId        = null;

  // Camera juice
  var shakeX = 0, shakeY = 0;
  // Slow-mo on perfect
  var slowMoFrames = 0;
  // Ghost trail for moving block
  var prevMovingX  = 0;
  // BUG FIX: passthrough click protection
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
    var atm = getAtmosphere(floor);
    return atm.blocks[floor % atm.blocks.length];
  }

  function getSpeed(floor) {
    var t = Math.min(floor / 65, 1);
    return CONFIG.speedStart + t * t * (3 - 2 * t) * (CONFIG.speedMax - CONFIG.speedStart);
  }

  function addShake(intensity) {
    shakeX = (Math.random() - 0.5) * intensity * 2;
    shakeY = (Math.random() - 0.5) * intensity * 2;
  }

  function showCombo(n) {
    comboNum.textContent = n;
    comboBadge.classList.remove('hidden');
    // Force reflow to restart ring animation
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
    // ── BUG FIX: lock drops for 450ms to prevent passthrough clicks ──
    dropLocked = true;
    setTimeout(function () { dropLocked = false; }, CONFIG.dropLockMs);

    tower        = [];
    score        = 0;
    combo        = 0;
    cameraY      = 0;
    cameraTarget = 0;
    currentAtm   = ATMOSPHERES[0];
    particles    = new ParticleSystem();
    floatingTexts.length = 0;
    shakeX = 0; shakeY = 0;
    slowMoFrames = 0;
    prevMovingX  = 0;

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
    // BUG FIX: reject passthrough clicks and off-state calls
    if (dropLocked || state !== 'playing' || !movingBlock) return;
    audio._init();

    var top  = tower[tower.length - 1];
    var mx   = movingBlock.x, mw = movingBlock.w;
    var tx   = top.x,         tw = top.w;

    var overlapStart = Math.max(mx, tx);
    var overlapEnd   = Math.min(mx + mw, tx + tw);
    var overlap      = overlapEnd - overlapStart;

    // Complete miss
    if (overlap <= 0) {
      audio.playGameOver();
      addShake(5);
      particles.emitDebris(mx, movingBlock.y, mw, movingBlock.color);
      triggerGameOver('miss');
      return;
    }

    // Perfect: overlap covers ≥ (mw - perfectThresh) of moving block
    var isPerfect = overlap >= mw - CONFIG.perfectThresh;

    var placedX, placedW;
    if (isPerfect) {
      placedX = tx;
      placedW = Math.min(tw + CONFIG.perfectBonus, CONFIG.blockStartW);
    } else {
      placedX = overlapStart;
      placedW = overlap;
    }

    // Too narrow (only on non-perfect)
    if (!isPerfect && placedW < CONFIG.minBlockW) {
      audio.playGameOver();
      addShake(5);
      particles.emitDebris(placedX, movingBlock.y, placedW, movingBlock.color);
      triggerGameOver('narrow');
      return;
    }

    // Place block
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

    // Atmosphere transition
    var newAtm = getAtmosphere(score);
    if (newAtm !== currentAtm) {
      currentAtm = newAtm;
      if (currentAtm.label !== prevAtmLabel) {
        prevAtmLabel = currentAtm.label;
        atmLabel.style.opacity = '1';
        atmLabel.textContent   = currentAtm.label;
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
    // Decay shake
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

    drawBackground(ctx, canvasW, canvasH, score, currentAtm, cameraY);

    // Tower blocks
    for (var i = 0; i < tower.length; i++) tower[i].draw(ctx, cameraY);

    // Ghost trail of moving block
    if (movingBlock && state === 'playing') {
      ctx.globalAlpha = 0.10;
      ctx.fillStyle   = movingBlock.color;
      ctx.fillRect(prevMovingX, movingBlock.y - cameraY, movingBlock.w, movingBlock.h);
      ctx.globalAlpha = 1;
      movingBlock.draw(ctx, cameraY);
    }

    // Particles
    particles.draw(ctx, cameraY);

    // Floating texts
    drawFloatingTexts(ctx, cameraY);

    // Ambient glow under tower top
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
    } else if (state === 'over') {
      updateCamera();
      particles.update();
      updateFloatingTexts();
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

  // BUG FIX: stopPropagation prevents click from reaching canvas via bubbling
  btnStart.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame();
    if (!rafId) loop();
  });

  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame();
  });

  loop();

})();
