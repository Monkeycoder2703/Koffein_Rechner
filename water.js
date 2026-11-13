'use strict';
/* Wasser-Effekt: Wellen folgen dem Mauszeiger. Liegt im Hintergrund (#bg), also hinter der ganzen Oberfläche.
   WebGL-Shader, höchstens 32 Wellen gleichzeitig, läuft nur solange Wellen sichtbar sind. */
(() => {
  if (REDUCED) return;
  const host = $('bg'); if (!host) return;
  const cv = document.createElement('canvas'); cv.id = 'water'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  host.insertBefore(cv, host.querySelector('.grain'));

  const N = 32, LIFE = 4.2, SCALE = 0.5;
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
  float a=clamp(abs(h)*.38+spec*.5+fres*.22+glow*.22,0.,.62);
  gl_FragColor=vec4((col*(.55+spec)+vec3(spec))*a+uA*glow*.22,a);
}`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
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
  function draw() {
    raf = 0; const t = now(); let live = false;
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
    if (dist > 26 && tt - lastT > 28) { spawn(x, y, .45 + Math.min(1, dist / 90) * .65); lastX = x; lastY = y; lastT = tt; } else kick();
  }
  addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
  // Auf dem Handy feuert pointermove nicht mehr, sobald die Seite scrollt: touchmove liefert die Spur weiter
  addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
  addEventListener('pointerdown', (e) => { lastX = e.clientX; lastY = e.clientY; spawn(e.clientX, e.clientY, 1.7); }, { passive: true });
})();
