'use strict';
/* CHAOS MODE = Rave: Beat-Blitze im Takt, Laser, Scheinwerfer, Discokugel, Equalizer, Konfetti, Blitze, schnelle Farbwechsel, Ticker, Musik.
   Sicherheit: Blinken bleibt unter 3 Hz, vorher gibt es eine Warnung, bei "weniger Bewegung" läuft nur das Farbtheme. */
const Chaos = (() => {
  const root = document.documentElement, SVGNS = 'http://www.w3.org/2000/svg';
  let on = false, timers = [], audio = null, tracks = [], ti = 0, muted = false, synth = null, loaded = false, ready = false, session = 0;

  const fx = () => $('fx');
  function bolt() {
    if (fx().querySelectorAll('.bolt').length > 3) return;
    const w = 200 + Math.random() * 260, hgt = innerHeight * (.7 + Math.random() * .5);
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'bolt'); svg.setAttribute('viewBox', '0 0 100 200'); svg.setAttribute('preserveAspectRatio', 'none');
    const path = (x0, y0, steps, spread, dir) => { let x = x0, y = y0, pts = [x.toFixed(0) + ',' + y.toFixed(0)]; for (let i = 0; i < steps; i++) { y += (200 - y0) / steps * (.7 + Math.random() * .6); x = Math.max(4, Math.min(96, x + (Math.random() * 2 - 1) * spread + dir * 4)); pts.push(x.toFixed(0) + ',' + Math.min(200, y).toFixed(0)); } return pts; };
    const main = path(30 + Math.random() * 40, 0, 11, 26, 0), lines = [main];
    for (let k = 0; k < 3; k++) { const p = main[2 + Math.floor(Math.random() * 7)].split(','); lines.push(path(+p[0], +p[1], 4 + Math.floor(Math.random() * 3), 20, Math.random() < .5 ? -1 : 1)); }
    lines.forEach((pts, i) => ['glow', 'core'].forEach((cls) => { const pl = document.createElementNS(SVGNS, 'polyline'); pl.setAttribute('points', pts.join(' ')); pl.setAttribute('class', cls + (i ? ' fork' : '')); svg.append(pl); }));
    svg.style.width = w + 'px'; svg.style.height = hgt + 'px';
    svg.style.left = Math.random() * (innerWidth - w * .5) - w * .25 + 'px'; svg.style.top = -Math.random() * hgt * .15 + 'px';
    fx().append(svg); setTimeout(() => svg.remove(), 650);
  }
  function rain() {
    if (fx().childElementCount > 40) return;
    const b = document.createElement('i'); b.className = 'bean rain';
    b.style.left = Math.random() * 100 + 'vw'; b.style.setProperty('--t', 1.8 + Math.random() * 1.6 + 's'); b.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
    b.style.setProperty('--sz', (0.7 + Math.random() * 1.1).toFixed(2));
    fx().append(b); setTimeout(() => b.remove(), 3600);
  }

  function setBeat(bpm) {
    let b = Number(bpm) || 150; while (b > 170) b /= 2; while (b < 70) b *= 2;
    root.style.setProperty('--beat', (60 / b).toFixed(3) + 's'); // 150 BPM = 0,4 s; Licht blitzt höchstens ~2,5x pro Sekunde
  }
  function confetti() {
    if (fx().childElementCount > 45) return;
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.setProperty('--hh', Math.floor(Math.random() * 360));
    c.style.setProperty('--t', 1.4 + Math.random() * 1.4 + 's'); c.style.setProperty('--rot', (Math.random() * 1200 - 600) + 'deg');
    fx().append(c); setTimeout(() => c.remove(), 3000);
  }
  function rig() { // Licht-Show aufbauen
    const f = fx(), cols = ['var(--accent)', 'var(--volt)', 'var(--pink)', 'var(--honey)'];
    for (let i = 0; i < 7; i++) { const l = document.createElement('i'); l.className = 'laser rig'; l.style.left = (8 + i * 14) + '%';
      l.style.setProperty('--c', cols[i % 4]); l.style.setProperty('--a', (20 + Math.random() * 30) * (i % 2 ? 1 : -1) + 'deg'); l.style.setProperty('--d', (0.9 + Math.random() * 1.2).toFixed(2) + 's'); l.style.setProperty('--dl', -Math.random() * 2 + 's'); f.append(l); }
    for (let i = 0; i < 3; i++) { const sp = document.createElement('i'); sp.className = 'spot rig'; sp.style.setProperty('--x', (15 + i * 35) + '%'); sp.style.setProperty('--y', (25 + (i % 2) * 45) + '%');
      sp.style.setProperty('--c', cols[(i + 1) % 4]); sp.style.setProperty('--d', (1.4 + i * .6) + 's'); f.append(sp); }
    const d = document.createElement('i'); d.className = 'disco rig'; f.append(d);
    const eq = $('eq'); if (eq && !eq.childElementCount) for (let i = 0; i < 28; i++) { const e = document.createElement('i'); e.style.setProperty('--m', (.35 + Math.random() * .65).toFixed(2)); e.style.setProperty('--dl', -Math.random() * .6 + 's'); eq.append(e); }
  }

  /* ---- Show reagiert auf die Musik ---- */
  let raf = 0, lastT = 0, reactive = false, buf = null, avg = 0, lastBeat = 0, beatN = 0, f = [0, 0], sm = { b: 0, m: 0 }, cups = [];
  function onBeat() {
    f[beatN % 2] = 1; beatN++;
    bolt(); if (Math.random() < .35) setTimeout(bolt, 90);
    for (let k = 0; k < 5; k++) confetti();
  }
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - lastT < 30) return; lastT = ts;
    const A = synth ? synth.an : (audio && audio._r ? man : null);
    if (!A) { if (reactive) { reactive = false; root.classList.remove('react'); } return; }
    if (!reactive) { reactive = true; root.classList.add('react'); cups = [...document.querySelectorAll('.cup,.hero-cup')]; }
    if (!buf || buf.length !== A.frequencyBinCount) buf = new Uint8Array(A.frequencyBinCount);
    A.getByteFrequencyData(buf);
    const rng = (a, b) => { let x = 0; for (let i = a; i < b; i++) x += buf[i]; return x / ((b - a) * 255); };
    const bass = rng(1, 5), mid = rng(5, 40);
    sm.b = Math.max(bass, sm.b * .82); sm.m = Math.max(mid, sm.m * .86);
    avg = avg * .95 + bass * .05;
    if (bass > avg * 1.2 && bass > .3 && ts - lastBeat > 360) { lastBeat = ts; onBeat(); } // mindestens 360 ms Abstand: nie mehr als 3 Blitze pro Sekunde
    f[0] *= .8; f[1] *= .8;
    const F = fx(), B = $('bg'), Q = $('eq');
    F.style.setProperty('--bass', sm.b.toFixed(3)); F.style.setProperty('--mid', sm.m.toFixed(3));
    B.style.setProperty('--f1', f[0].toFixed(3)); B.style.setProperty('--f2', f[1].toFixed(3));
    if (Q) { const bars = Q.children, n = bars.length; for (let i = 0; i < n; i++) { const v = buf[1 + Math.floor(Math.pow(i / n, 1.6) * 120)] / 255; bars[i].style.transform = 'scaleY(' + (.08 + v * .92).toFixed(2) + ')'; } }
    const sc = (1 + sm.b * .14).toFixed(3); cups.forEach((c) => { c.style.scale = sc; });
  }
  function stopReact() {
    cancelAnimationFrame(raf); raf = 0; reactive = false; root.classList.remove('react'); cups.forEach((c) => { c.style.scale = ''; }); cups = [];
    const Q = $('eq'); if (Q) [...Q.children].forEach((b) => { b.style.transform = ''; }); sm = { b: 0, m: 0 }; f = [0, 0];
  }

  /* ---- Musik ---- */
  function setNow(txt) { $('np').textContent = t('now_playing') + txt; }
  /* Playlists: music/playlist.json = {playlists:[{id,name,tracks:[{title,file}]}]}. Die NSFW-Playlist liegt verschlüsselt in music/n/ und braucht den Code. */
  const FILE_OK = /^(?!.*\.\.)[\w\-. ()äöüÄÖÜß]+(\/[\w\-. ()äöüÄÖÜß]+)*\.(mp3|ogg|m4a|wav|opus|aac|bin)$/i;
  let lists = [], plId = 'all', nsfwKey = null, urlNow = null, listeners = [];
  try { plId = localStorage.getItem('kr-pl') || 'all'; } catch { /* egal */ }
  const clean = (arr) => (arr || []).filter((x) => x && typeof x.file === 'string' && FILE_OK.test(x.file))
    .map((x) => ({ title: String(x.title || x.file).slice(0, 90), file: x.file, bpm: Number(x.bpm) || 0 }));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
  function rebuild() {
    let src;
    if (plId === 'all') src = lists.filter((l) => !l.enc).flatMap((l) => l.tracks);
    else if (plId === 'synth') src = [];
    else { const l = lists.find((x) => x.id === plId); src = l ? l.tracks : lists.filter((x) => !x.enc).flatMap((x) => x.tracks); }
    tracks = shuffle(src.slice()); ti = 0;
  }
  let loadP = null;
  const loadTracks = () => loadP || (loadP = doLoad());
  async function doLoad() {
    loaded = true;
    try {
      const r = await fetch('music/playlist.json', { cache: 'no-store' }); const j = await r.json();
      lists = (j.playlists || (j.tracks ? [{ id: 'main', name: 'Playlist', tracks: j.tracks }] : []))
        .map((p) => ({ id: String(p.id || '').replace(/[^\w-]/g, ''), name: String(p.name || p.id).slice(0, 40), tracks: clean(p.tracks) })).filter((p) => p.id && p.tracks.length);
    } catch { lists = []; }
    try { const c = localStorage.getItem('kr-nsfw'); if (c) await unlock(c, true); } catch { /* egal */ }
    rebuild(); ready = true; listeners.forEach((f) => f());
  }
  async function derive(code, salt) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  // Code prüfen: Entschlüsselung der Titelliste klappt nur mit dem richtigen Code
  async function unlock(code, quiet) {
    if (!crypto || !crypto.subtle) return false;
    try {
      const buf = new Uint8Array(await (await fetch('music/n/list.bin', { cache: 'no-store' })).arrayBuffer());
      const key = await derive(String(code).trim(), buf.slice(0, 16));
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(16, 28) }, key, buf.slice(28));
      const tr = clean(JSON.parse(new TextDecoder().decode(plain)));
      nsfwKey = key; lists = lists.filter((l) => l.id !== 'nsfw'); lists.push({ id: 'nsfw', name: 'NSFW', enc: true, tracks: tr });
      try { localStorage.setItem('kr-nsfw', String(code).trim()); } catch { /* egal */ }
      if (!quiet) { rebuild(); listeners.forEach((f) => f()); }
      return true;
    } catch { return false; }
  }
  function lock() {
    nsfwKey = null; lists = lists.filter((l) => l.id !== 'nsfw'); try { localStorage.removeItem('kr-nsfw'); } catch { /* egal */ }
    if (plId === 'nsfw') setPlaylist('all'); else listeners.forEach((f) => f());
  }
  function setPlaylist(id) {
    plId = id; try { localStorage.setItem('kr-pl', id); } catch { /* egal */ }
    rebuild(); listeners.forEach((f) => f());
    if (on) { stopMusic(); begin(); }
  }
  async function decTrack(tr) {
    const buf = new Uint8Array(await (await fetch('music/' + tr.file.split('/').map(encodeURIComponent).join('/'))).arrayBuffer());
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, nsfwKey, buf.slice(12));
    return URL.createObjectURL(new Blob([plain], { type: 'audio/mpeg' }));
  }
  /* Audio-Analyse: Musik -> Analyser -> Lautstärke -> Lautsprecher. Der Analyser sitzt vor der Stummschaltung, die Show läuft also auch bei Mute weiter. */
  let mctx = null, mgain = null, man = null;
  function ensureMedia() {
    if (mctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try {
      mctx = new AC(); mgain = mctx.createGain(); mgain.gain.value = muted ? 0 : .85; man = mctx.createAnalyser(); man.fftSize = 1024; man.smoothingTimeConstant = .6;
      man.connect(mgain); mgain.connect(mctx.destination);
    } catch { mctx = null; return false; }
    return true;
  }
  async function playTrack() {
    const tr = tracks[ti % tracks.length], my = session;
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; try { if (audio._src) audio._src.disconnect(); } catch { /* egal */ } }
    if (urlNow) { URL.revokeObjectURL(urlNow); urlNow = null; }
    const au = new Audio(); audio = au; au.volume = .85; au.muted = muted;
    if (ensureMedia()) {
      if (mctx.resume) mctx.resume().catch(() => {});
      if (mctx.state === 'running') { try { au._src = mctx.createMediaElementSource(au); au._src.connect(man); au._r = true; au.volume = 1; au.muted = false; } catch { au._r = false; } }
    }
    const next = () => { ti++; if (on && my === session && audio === au) playTrack(); };
    au.onended = next; au.onerror = () => { if (ti < tracks.length * 2) next(); };
    setNow(tr.title); setBeat(tr.bpm || 128);
    try {
      if (/\.bin$/i.test(tr.file)) { const u = await decTrack(tr); if (!on || my !== session || audio !== au) { URL.revokeObjectURL(u); return; } urlNow = u; au.src = u; }
      else au.src = 'music/' + tr.file.split('/').map(encodeURIComponent).join('/');
      au.play().catch(() => {});
    } catch { next(); }
  }
  function startSynth() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(), master = ctx.createGain(), comp = ctx.createDynamicsCompressor(); if (ctx.resume) ctx.resume();
    master.gain.value = muted ? 0 : .32; master.connect(comp); comp.connect(ctx.destination);
    const bus = ctx.createGain(), an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .6; bus.connect(an); bus.connect(master);
    const noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate), nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const step = 60 / 150 / 4, roots = [55, 55, 65.41, 49], scale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
    let n = 0, next = ctx.currentTime + .1;
    const kick = (tm) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, tm); o.frequency.exponentialRampToValueAtTime(40, tm + .15);
      g.gain.setValueAtTime(1, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .25); o.connect(g).connect(bus); o.start(tm); o.stop(tm + .3); };
    const hat = (tm, v) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(v, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .05); s.connect(f).connect(g).connect(bus); s.start(tm); s.stop(tm + .06); };
    const tone = (tm, fr, type, len, v, cut) => { const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = type; o.frequency.value = fr;
      fl.type = 'lowpass'; fl.frequency.value = cut; g.gain.setValueAtTime(v, tm); g.gain.exponentialRampToValueAtTime(.001, tm + len); o.connect(fl).connect(g).connect(bus); o.start(tm); o.stop(tm + len + .02); };
    const id = setInterval(() => {
      while (next < ctx.currentTime + .2) {
        const s = n % 16, bar = Math.floor(n / 16) % 4;
        if (s % 4 === 0) kick(next); if (s % 2 === 1) hat(next, .25); if (s % 4 === 2) hat(next, .12);
        if (s % 2 === 0 || s === 3 || s === 11) tone(next, roots[bar] * (s >= 8 ? 2 : 1), 'sawtooth', step * 1.8, .5, 500 + ((n / 4) % 8) * 180);
        if (s % 2 === 0 || s % 3 === 0) tone(next, scale[(n * 3 + bar * 2) % scale.length] * (s >= 8 ? 1 : 2), 'square', step * .9, .12, 3200);
        n++; next += step;
      }
    }, 40);
    synth = { ctx, master, id, an }; setNow(t('synth_name')); setBeat(150);
  }
  function stopMusic() {
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; try { if (audio._src) audio._src.disconnect(); } catch { /* egal */ } audio = null; }
    if (urlNow) { URL.revokeObjectURL(urlNow); urlNow = null; }
    if (synth) { clearInterval(synth.id); synth.ctx.close().catch(() => {}); synth = null; }
  }
  function begin() { if (!on) return; if (tracks.length) playTrack(); else startSynth(); }
  // Playlist wird vorher geladen, damit der Start direkt im Tipp-Ereignis passiert (iPhone/Safari erlaubt Ton sonst nicht)
  function startMusic() { if (loaded && ready) begin(); else loadTracks().then(() => { if (on) begin(); }); }
  function skip() {
    if (!on) return;
    if (tracks.length > 1) { ti++; playTrack(); }
    else if (!tracks.length) { stopMusic(); startSynth(); } // neuer Zufalls-Start für den Beat
  }
  function setMuted(m) {
    muted = m; if (audio && !audio._r) audio.muted = m; if (mgain) mgain.gain.value = m ? 0 : .85; if (synth) synth.master.gain.value = m ? 0 : .32;
    const u = $('mute').querySelector('use'); u.setAttribute('href', m ? '#i-mute' : '#i-volume');
  }

  function start() {
    if (on) return; on = true; session++;
    root.classList.add('chaos');
    const tx = t('ticker').repeat(4); $('tk').textContent = tx + tx;
    $('player').hidden = false; setMuted(muted);
    setBeat(150);
    if (!REDUCED) { ensureMedia(); if (mctx && mctx.resume) mctx.resume().catch(() => {}); raf = requestAnimationFrame(loop); rig(); timers.push(setInterval(bolt, 1100), setInterval(rain, 160), setInterval(confetti, 110)); bolt(); }
    startMusic();
  }
  function stop() {
    if (!on) return; on = false;
    root.classList.remove('chaos'); timers.forEach(clearInterval); timers = []; stopReact();
    fx().querySelectorAll('.bolt,.rain,.confetti,.rig').forEach((e) => e.remove()); root.style.removeProperty('--beat');
    stopMusic(); $('player').hidden = true;
  }
  function relabel() { if (on) { $('tk').textContent = t('ticker').repeat(8); if (synth) setNow(t('synth_name')); else if (tracks.length) setNow(tracks[ti % tracks.length].title); } }
  return { preload: loadTracks, lists: () => lists, get plId() { return plId; }, get unlocked() { return !!nsfwKey; }, unlock, lock, setPlaylist, onChange: (f) => listeners.push(f), preloadDone: () => ready, get on() { return on; }, start, stop, skip, relabel, toggleMute: () => setMuted(!muted) };
})();
