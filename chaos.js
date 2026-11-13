'use strict';
/* CHAOS MODE: Theme-Wechsel mit Blitzen, Bohnenregen, Ticker und Musik.
   Sicherheit: Blinken bleibt unter 3 Hz, vorher gibt es eine Warnung, bei "weniger Bewegung" läuft nur das Farbtheme. */
const Chaos = (() => {
  const root = document.documentElement, SVGNS = 'http://www.w3.org/2000/svg';
  let on = false, timers = [], audio = null, tracks = [], ti = 0, muted = false, synth = null, loaded = false, ready = false, session = 0;

  const fx = () => $('fx');
  function bolt() {
    const w = 90 + Math.random() * 90, hgt = 220 + Math.random() * 260;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'bolt'); svg.setAttribute('viewBox', '0 0 100 200'); svg.setAttribute('preserveAspectRatio', 'none');
    let pts = '50,0', x = 50; for (let y = 25; y <= 200; y += 25) { x = Math.max(8, Math.min(92, x + (Math.random() * 60 - 30))); pts += ` ${x.toFixed(0)},${y}`; }
    const pl = document.createElementNS(SVGNS, 'polyline'); pl.setAttribute('points', pts); svg.append(pl);
    svg.style.width = w + 'px'; svg.style.height = hgt + 'px';
    svg.style.left = Math.random() * (innerWidth - w) + 'px'; svg.style.top = Math.random() * Math.max(10, innerHeight - hgt) + 'px';
    fx().append(svg); setTimeout(() => svg.remove(), 600);
  }
  function rain() {
    if (fx().childElementCount > 70) return;
    const b = document.createElement('i'); b.className = 'bean rain';
    b.style.left = Math.random() * 100 + 'vw'; b.style.setProperty('--t', 1.8 + Math.random() * 1.6 + 's'); b.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
    b.style.setProperty('--sz', (0.7 + Math.random() * 1.1).toFixed(2));
    fx().append(b); setTimeout(() => b.remove(), 3600);
  }

  /* ---- Musik ---- */
  function setNow(txt) { $('np').textContent = t('now_playing') + txt; }
  async function loadTracks() {
    if (loaded) return; loaded = true;
    try {
      const r = await fetch('music/playlist.json', { cache: 'no-store' }); const j = await r.json();
      tracks = (j.tracks || []).filter((x) => x && typeof x.file === 'string' && /^[\w\-. ()äöüÄÖÜß]+\.(mp3|ogg|m4a|wav|opus|aac)$/i.test(x.file))
        .map((x) => ({ title: String(x.title || x.file).slice(0, 60), file: x.file }));
      for (let i = tracks.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [tracks[i], tracks[k]] = [tracks[k], tracks[i]]; }
    } catch { tracks = []; }
    ready = true;
  }
  function playTrack() {
    const tr = tracks[ti % tracks.length], my = session;
    if (audio) { audio.pause(); audio.onended = null; }
    audio = new Audio('music/' + encodeURIComponent(tr.file)); audio.volume = .85; audio.muted = muted;
    audio.onended = () => { ti++; if (on && my === session) playTrack(); };
    audio.onerror = () => { ti++; if (on && my === session && ti < tracks.length * 2) playTrack(); };
    audio.play().catch(() => {}); setNow(tr.title);
  }
  function startSynth() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(), master = ctx.createGain(), comp = ctx.createDynamicsCompressor(); if (ctx.resume) ctx.resume();
    master.gain.value = muted ? 0 : .32; master.connect(comp); comp.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate), nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const step = 60 / 150 / 4, roots = [55, 55, 65.41, 49], scale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
    let n = 0, next = ctx.currentTime + .1;
    const kick = (tm) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, tm); o.frequency.exponentialRampToValueAtTime(40, tm + .15);
      g.gain.setValueAtTime(1, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .25); o.connect(g).connect(master); o.start(tm); o.stop(tm + .3); };
    const hat = (tm, v) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(v, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .05); s.connect(f).connect(g).connect(master); s.start(tm); s.stop(tm + .06); };
    const tone = (tm, fr, type, len, v, cut) => { const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = type; o.frequency.value = fr;
      fl.type = 'lowpass'; fl.frequency.value = cut; g.gain.setValueAtTime(v, tm); g.gain.exponentialRampToValueAtTime(.001, tm + len); o.connect(fl).connect(g).connect(master); o.start(tm); o.stop(tm + len + .02); };
    const id = setInterval(() => {
      while (next < ctx.currentTime + .2) {
        const s = n % 16, bar = Math.floor(n / 16) % 4;
        if (s % 4 === 0) kick(next); if (s % 2 === 1) hat(next, .25); if (s % 4 === 2) hat(next, .12);
        if (s % 2 === 0 || s === 3 || s === 11) tone(next, roots[bar] * (s >= 8 ? 2 : 1), 'sawtooth', step * 1.8, .5, 500 + ((n / 4) % 8) * 180);
        if (s % 2 === 0 || s % 3 === 0) tone(next, scale[(n * 3 + bar * 2) % scale.length] * (s >= 8 ? 1 : 2), 'square', step * .9, .12, 3200);
        n++; next += step;
      }
    }, 40);
    synth = { ctx, master, id }; setNow(t('synth_name'));
  }
  function stopMusic() {
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; audio = null; }
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
    muted = m; if (audio) audio.muted = m; if (synth) synth.master.gain.value = m ? 0 : .32;
    const u = $('mute').querySelector('use'); u.setAttribute('href', m ? '#i-mute' : '#i-volume');
  }

  function start() {
    if (on) return; on = true; session++;
    root.classList.add('chaos');
    const tx = t('ticker').repeat(4); $('tk').textContent = tx + tx;
    $('player').hidden = false; setMuted(muted);
    if (!REDUCED) { timers.push(setInterval(bolt, 950), setInterval(rain, 200)); bolt(); }
    startMusic();
  }
  function stop() {
    if (!on) return; on = false;
    root.classList.remove('chaos'); timers.forEach(clearInterval); timers = [];
    fx().querySelectorAll('.bolt,.rain').forEach((e) => e.remove());
    stopMusic(); $('player').hidden = true;
  }
  function relabel() { if (on) { $('tk').textContent = t('ticker').repeat(8); if (synth) setNow(t('synth_name')); else if (tracks.length) setNow(tracks[ti % tracks.length].title); } }
  return { preload: loadTracks, get on() { return on; }, start, stop, skip, relabel, toggleMute: () => setMuted(!muted) };
})();
