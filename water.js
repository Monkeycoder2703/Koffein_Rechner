'use strict';
/* Wasser-Effekt: Wellen folgen dem Mauszeiger. Liegt im Hintergrund (#bg), also hinter der ganzen Oberfläche.
   WebGL-Shader, höchstens 32 Wellen gleichzeitig, läuft nur solange Wellen sichtbar sind. */
(() => {
  if (REDUCED) return;
  const host = $('bg'); if (!host) return;
  const cv = document.createElement('canvas'); cv.id = 'water'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  host.insertBefore(cv, host.querySelector('.grain'));
  if (!gl) { fallback2d(); return; }
  const maxU = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 16;
  const N = Math.max(8, Math.min(LITE ? 12 : 20, maxU - 8)), LIFE = 3.4, SCALE = LITE ? 0.3 : 0.42;
  const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const fs = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform vec4 uR[${N}];uniform vec3 uA;uniform vec3 uB;uniform vec3 uM;
void main(){
  vec2 p=gl_FragCoord.xy;float h=0.;vec2 g=vec2(0.);
  for(int i=0;i<${N};i++){
    vec4 r=uR[i];float age=uTime-r.z;
    if(age<0.||age>${LIFE.toFixed(1)}) continue;
    vec2 d=p-r.xy;float dist=length(d);float x=dist-age*230.*${SCALE.toFixed(2)}*2.;
    float s=(16.+age*14.)*${SCALE.toFixed(2)}*2.;float env=exp(-x*x/(2.*s*s))*exp(-age*.95)*r.w;
    float k=.30/(${SCALE.toFixed(2)}*2.);float wv=sin(x*k);
    h+=wv*env;g+=(d/(dist+.001))*(cos(x*k)*k*env-wv*x/(s*s)*env);
  }
  vec3 n=normalize(vec3(-g*26.,1.));
  float spec=pow(max(dot(n,normalize(vec3(.45,.6,.65))),0.),28.);
  float fres=clamp(length(g)*9.,0.,1.);
  vec3 col=mix(uA,uB,clamp(.5+h*.9,0.,1.));
  float glow=exp(-dot(p-uM.xy,p-uM.xy)/(2.*(110.*${SCALE.toFixed(2)}*2.)*(110.*${SCALE.toFixed(2)}*2.)))*uM.z;
  float a=clamp(abs(h)*.55+spec*.6+fres*.3+glow*.26,0.,.8);
  gl_FragColor=vec4((col*(.55+spec)+vec3(spec))*a+uA*glow*.22,a);
}`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn('Wasser-Shader:', gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn('Wasser-Shader: Link fehlgeschlagen'); cv.remove(); fallback2d(); return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n), uRes = U('uRes'), uTime = U('uTime'), uR = U('uR'), uA = U('uA'), uB = U('uB'), uM = U('uM');
  const rip = new Float32Array(N * 4); for (let i = 0; i < N; i++) rip[i * 4 + 2] = -100;
  let idx = 0, raf = 0, W = 1, H = 1, lastX = -999, lastY = -999, lastT = 0, mx = -999, my = -999, glowAmt = 0;
  const t0 = performance.now(), now = () => (performance.now() - t0) / 1000;

  function size() { W = Math.max(2, Math.round(innerWidth * SCALE)); H = Math.max(2, Math.round(innerHeight * SCALE)); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); gl.uniform2f(uRes, W, H); }
  size(); addEventListener('resize', size);
  function hsl(h, s, l) { const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }

  function spawn(x, y, strength) {
    const o = idx * 4; rip[o] = x * SCALE; rip[o + 1] = (innerHeight - y) * SCALE; rip[o + 2] = now(); rip[o + 3] = strength; idx = (idx + 1) % N; kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }
  let lastDraw = 0;
  function draw() {
    raf = 0; const t = now(); let live = false;
    if (t - lastDraw < (LITE ? .04 : .028)) { raf = requestAnimationFrame(draw); return; } // höchstens ca. 35 Bilder pro Sekunde: schont Akku und Handys
    lastDraw = t;
    for (let i = 0; i < N; i++) if (t - rip[i * 4 + 2] < LIFE) { live = true; break; }
    glowAmt *= .94; if (glowAmt > .02) live = true;
    const chaos = document.documentElement.classList.contains('chaos');
    const A = chaos ? hsl((t * .35) % 1, 1, .6) : [.12, .9, .8], B = chaos ? hsl((t * .35 + .5) % 1, 1, .65) : [1, .62, .5];
    gl.uniform1f(uTime, t); gl.uniform4fv(uR, rip); gl.uniform3f(uA, A[0], A[1], A[2]); gl.uniform3f(uB, B[0], B[1], B[2]);
    gl.uniform3f(uM, mx * SCALE, (innerHeight - my) * SCALE, glowAmt);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (live) raf = requestAnimationFrame(draw); else { gl.clear(gl.COLOR_BUFFER_BIT); }
  }
  function move(x, y) {
    mx = x; my = y; glowAmt = Math.min(1, glowAmt + .25);
    const dist = Math.hypot(x - lastX, y - lastY), tt = performance.now();
    if (dist > 22 && tt - lastT > 45) { spawn(x, y, .8 + Math.min(1, dist / 80) * .7); lastX = x; lastY = y; lastT = tt; } else kick();
  }
  // Eigene Wellen, auch ohne Mauszeiger: man sieht sofort, dass das Wasser da ist
  const amb = () => { if (!document.hidden) spawn(Math.random() * innerWidth, Math.random() * innerHeight, .9); setTimeout(amb, document.documentElement.classList.contains('chaos') ? 2200 : 6000); };
  setTimeout(amb, 1200);
  cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cv.remove(); fallback2d(); });
  addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
  // Auf dem Handy feuert pointermove nicht mehr, sobald die Seite scrollt: touchmove liefert die Spur weiter
  addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
  addEventListener('pointerdown', (e) => { lastX = e.clientX; lastY = e.clientY; spawn(e.clientX, e.clientY, 1.7); }, { passive: true });

  function fallback2d() { // Ohne WebGL: einfache Ringe auf einem 2D-Canvas
    const c = document.createElement('canvas'); c.id = 'water'; c.setAttribute('aria-hidden', 'true'); host.insertBefore(c, host.querySelector('.grain'));
    const g = c.getContext('2d'); if (!g) { c.remove(); return; }
    let rings = [], raf = 0, lx = -999, ly = -999, lt = 0;
    const fit = () => { c.width = innerWidth; c.height = innerHeight; }; fit(); addEventListener('resize', fit);
    const add = (x, y, s) => { rings.push({ x, y, s, t: performance.now() }); if (rings.length > 40) rings.shift(); if (!raf) raf = requestAnimationFrame(frame); };
    function frame() {
      raf = 0; g.clearRect(0, 0, c.width, c.height); const n = performance.now(), chaos = document.documentElement.classList.contains('chaos');
      rings = rings.filter((r) => n - r.t < 3200);
      for (const r of rings) { const a = (n - r.t) / 3200;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(r.x, r.y, a * 260 + k * 14, 0, 6.2832);
          g.strokeStyle = chaos ? 'hsla(' + ((n / 6 + k * 40) % 360) + ',100%,65%,' + ((1 - a) * .6) + ')' : 'rgba(31,229,200,' + ((1 - a) * .5 / (k + 1)) + ')'; g.lineWidth = 2.5 - k * .6; g.stroke(); } }
      if (rings.length) raf = requestAnimationFrame(frame);
    }
    addEventListener('pointermove', (e) => { const n = performance.now(); if (Math.hypot(e.clientX - lx, e.clientY - ly) > 22 && n - lt > 30) { add(e.clientX, e.clientY, 1); lx = e.clientX; ly = e.clientY; lt = n; } }, { passive: true });
    addEventListener('pointerdown', (e) => add(e.clientX, e.clientY, 2), { passive: true });
  }
})();
