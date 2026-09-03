/* Sikiru Adewale — Portfolio Scripts */

function toggleTheme() {
  var r = document.documentElement;
  var c = r.dataset.theme;
  if (c === 'dark') r.dataset.theme = 'light';
  else if (c === 'light') r.dataset.theme = '';
  else r.dataset.theme = window.matchMedia('(prefers-color-scheme:dark)').matches ? 'light' : 'dark';
}

(function () {
  var canvas = document.getElementById('circumplex');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var raf, t = 0;
  var dpr = window.devicePixelRatio || 1;
  var trail = [];
  var emoLabel = document.getElementById('emo-label');


  var zones = [
    { name:'Excited', emoji:'⚡', v: 0.60, a: 0.80, role:'hot'    },
    { name:'Happy',   emoji:'😊', v: 0.85, a: 0.30, role:'signal'  },
    { name:'Content', emoji:'🌿', v: 0.72, a:-0.38, role:'signal'  },
    { name:'Serene',  emoji:'🌊', v: 0.38, a:-0.80, role:'signal'  },
    { name:'Bored',   emoji:'😑', v:-0.38, a:-0.78, role:'faint'   },
    { name:'Sad',     emoji:'💧', v:-0.72, a:-0.38, role:'faint'   },
    { name:'Tense',   emoji:'😬', v:-0.58, a: 0.52, role:'accent'  },
    { name:'Angry',   emoji:'🔥', v:-0.38, a: 0.82, role:'hot'    },
    { name:'Neutral', emoji:'·',  v: 0.00, a: 0.00, role:'faint'   },
  ];

  function cssVar(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  function zoneColor(role) {
    if (role === 'hot')    return cssVar('--hot');
    if (role === 'signal') return cssVar('--signal');
    if (role === 'accent') return cssVar('--accent');
    return cssVar('--faint');
  }

  /* Smooth wandering path through valence-arousal space */
  function getState(t) {
    var vx = 0.55*Math.sin(t/160) + 0.26*Math.sin(t/72+1.3) + 0.14*Math.sin(t/31+2.7);
    var vy = 0.52*Math.sin(t/210+0.6) + 0.28*Math.sin(t/85+2.1) + 0.12*Math.sin(t/38+0.4);
    var r = Math.sqrt(vx*vx + vy*vy);
    if (r > 0.90) { vx = vx/r*0.90; vy = vy/r*0.90; }
    return { x: vx, y: vy };
  }

  function nearestZone(s) {
    var best = zones[0], bestD = Infinity;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      var d = Math.sqrt((s.x-z.v)*(s.x-z.v) + (s.y-z.a)*(s.y-z.a));
      if (d < bestD) { bestD = d; best = z; }
    }
    return best;
  }

  function resize() {
    var w = canvas.parentElement ? canvas.parentElement.clientWidth : 400;
    var h = 240;
    canvas.style.height = h + 'px';
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    var W = canvas.width  / dpr;
    var H = canvas.height / dpr;

    var state = getState(t);
    trail.push({ x: state.x, y: state.y });
    if (trail.length > 70) trail.shift();

    var zone = nearestZone(state);
    if (emoLabel) emoLabel.textContent = zone.emoji + ' ' + zone.name;

    var cSignal = cssVar('--signal');
    var cAccent = cssVar('--accent');
    var cHot    = cssVar('--hot');
    var cFaint  = cssVar('--faint');
    var cInk    = cssVar('--ink');

    /* circumplex center and radius */
    var cx = W / 2;
    var cy = H / 2;
    var R  = Math.min(W * 0.40, H * 0.40);

    ctx.clearRect(0, 0, W, H);

    /* Background radial fill */
    ctx.globalAlpha = 0.13;
    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, cAccent);
    bg.addColorStop(0.55, cSignal);
    bg.addColorStop(1, 'transparent');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

    /* Outer circle */
    ctx.globalAlpha = 0.60;
    ctx.strokeStyle = cAccent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();

    /* Inner ring */
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = cFaint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, Math.PI*2); ctx.stroke();

    /* Axes */
    ctx.globalAlpha = 0.40;
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = cFaint; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - R*1.12, cy); ctx.lineTo(cx + R*1.12, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R*1.12); ctx.lineTo(cx, cy + R*1.12); ctx.stroke();
    ctx.setLineDash([]);

    /* Axis labels */
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.globalAlpha = 0.80;
    ctx.fillStyle = cSignal;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH AROUSAL', cx, cy - R*1.14 - 3);
    ctx.fillStyle = cFaint;
    ctx.globalAlpha = 0.65;
    ctx.fillText('LOW AROUSAL',  cx, cy + R*1.14 + 11);
    ctx.fillStyle = cHot;
    ctx.globalAlpha = 0.80;
    ctx.textAlign = 'right';
    ctx.fillText('NEG. VALENCE', cx - R*1.08, cy - 4);
    ctx.fillStyle = cAccent;
    ctx.textAlign = 'left';
    ctx.fillText('POS. VALENCE', cx + R*1.08, cy - 4);

    /* Emotion zone markers */
    for (var i = 0; i < zones.length; i++) {
      var z   = zones[i];
      var zx  = cx + z.v * R;
      var zy  = cy - z.a * R;
      var col = zoneColor(z.role);
      var active = (z === zone);

      if (active && z.name !== 'Neutral') {
        ctx.globalAlpha = 0.30;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(zx, zy, 26, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(zx, zy, 14, 0, Math.PI*2); ctx.fill();
      }

      ctx.globalAlpha = active ? 1.0 : 0.55;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(zx, zy, active ? 5 : 3, 0, Math.PI*2); ctx.fill();

      var lx = cx + z.v * R * (z.name === 'Neutral' ? 1.0 : 1.38);
      var ly = cy - z.a * R * (z.name === 'Neutral' ? 1.0 : 1.38);
      if (z.name === 'Neutral') { lx += 4; }
      ctx.globalAlpha = active ? 1.0 : 0.60;
      ctx.fillStyle   = col;
      ctx.font = (active ? 'bold 10px' : '600 9px') + ' "JetBrains Mono", monospace';
      ctx.textAlign   = z.v > 0.1 ? 'left' : z.v < -0.1 ? 'right' : 'center';
      ctx.fillText(z.emoji + ' ' + z.name, lx, ly + 3);
    }

    /* Trail */
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (var j = 1; j < trail.length; j++) {
      var a = j / trail.length;
      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = zoneColor(zone.role);
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(cx + trail[j-1].x * R, cy - trail[j-1].y * R);
      ctx.lineTo(cx + trail[j].x   * R, cy - trail[j].y   * R);
      ctx.stroke();
    }

    /* Current state dot */
    var dx  = cx + state.x * R;
    var dy  = cy - state.y * R;
    var dc  = zoneColor(zone.role);

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = dc;
    ctx.beginPath(); ctx.arc(dx, dy, 20, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 0.60;
    ctx.fillStyle = dc;
    ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = dc;
    ctx.beginPath(); ctx.arc(dx, dy, 6, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 1;
    t += 0.55;
    raf = requestAnimationFrame(draw);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function init() {
    resize();
    if (reduced) { t = 300; draw(); cancelAnimationFrame(raf); }
    else { draw(); }
  }

  window.addEventListener('resize', function () {
    cancelAnimationFrame(raf);
    resize();
    if (!reduced) draw();
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else window.addEventListener('load', init);
})();