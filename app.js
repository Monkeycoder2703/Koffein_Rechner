'use strict';
/* Koffein Rechner – Logik. Supabase-Aufrufe unverändert; $, t(), REDUCED kommen aus i18n.js, Chaos aus chaos.js. */
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

const LIMIT = 400, UNLOCK = LIMIT / 2; // Chaos Mode ab der Hälfte des Tageslimits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { mode: 'login', period: 'day', drinks: [], selected: null, items: [], rows: null, total: 0, username: '', cupReady: false,
  loggedIn: false, tab: 'dash', unlocked: false, warned: false, amount: null, custom: false };
const recovery = location.hash.includes('type=recovery'); // Link aus der "Passwort vergessen"-Mail
const locale = () => (LANG === 'en' ? 'en-GB' : 'de-DE');

const TXT = { // Supabase-Meldungen -> eigene Texte (nichts Internes anzeigen)
  'Invalid login credentials': 'e_login', 'Email not confirmed': 'e_confirm', 'Database error saving new user': 'e_signup',
  'Auth session missing!': 'e_session', 'New password should be different from the old password.': 'e_samepw'
};
function ok(res) {
  if (res.error) { const m = res.error.message || ''; throw new Error(t(TXT[m] || (/rate limit|too many/i.test(m) ? 'e_rate' : 'e_generic'))); }
  return res.data;
}
async function fn(name, body) { // Edge Function aufrufen
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) { let m = t('e_generic'); try { m = (await error.context.json()).error || m; } catch {} throw new Error(m); }
  return data;
}

/* ---------- Helfer ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function ico(name) {
  const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS(SVGNS, 'use'); u.setAttribute('href', '#i-' + name); s.append(u); return s;
}
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}
const msg = (id, text, good) => { const e = $(id); e.textContent = text || ''; e.className = 'msg ' + (good ? 'ok' : 'err'); };
async function busy(btn, job) {
  btn.classList.add('loading'); btn.disabled = true;
  try { return await job(); } finally { btn.classList.remove('loading'); btn.disabled = false; }
}
function countTo(el, to, dur = 1100) {
  const from = Number(el.dataset.v || 0); el.dataset.v = to;
  if (REDUCED || from === to) { el.textContent = to; return; }
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}
function toast(text, kind) {
  const el = h('div', { class: 'toast ' + (kind || ''), role: 'status' });
  const i = ico(kind === 'err' ? 'alert' : 'check'); i.classList.add('t-ico'); if (kind !== 'err') i.classList.add('draw');
  el.append(i, h('span', { text }));
  $('toasts').append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, kind === 'err' ? 5000 : 3200);
}

/* ---------- Hintergrund: schwebende Bohnen ---------- */
(function floaters() {
  const bg = $('bg');
  for (let i = 0; i < 16; i++) {
    const b = h('i', { class: 'fb' });
    b.style.left = (Math.random() * 100).toFixed(1) + '%';
    b.style.setProperty('--t', (16 + Math.random() * 16).toFixed(1) + 's'); b.style.setProperty('--d', (-Math.random() * 30).toFixed(1) + 's');
    b.style.setProperty('--sx', (Math.random() * 160 - 80).toFixed(0) + 'px'); b.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    b.style.setProperty('--sz', (0.6 + Math.random() * 1.1).toFixed(2));
    bg.insertBefore(b, bg.querySelector('.grain'));
  }
})();

/* ---------- Tasse (animiertes SVG) ---------- */
let cupN = 0;
function cupEl() {
  const id = 'cc' + (++cupN), wave = 'M-20 8q30-8 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0V230H-20Z', d = document.createElement('div');
  d.innerHTML = `<svg class="cup-svg" viewBox="0 -34 210 244" role="img" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="M36 20H164V90C164 130 140 160 100 160C60 160 36 130 36 90Z"/></clipPath></defs>
    <ellipse class="saucer" cx="100" cy="174" rx="82" ry="9"/>
    <g class="steam"><path d="M78 6q-9-11 0-22t0-22"/><path d="M100 2q-9-11 0-22t0-22"/><path d="M122 6q-9-11 0-22t0-22"/></g>
    <path class="body-fill" d="M36 20H164V90C164 130 140 160 100 160C60 160 36 130 36 90Z"/>
    <g clip-path="url(#${id})"><g class="liquid"><g class="wave w2"><path d="${wave}"/></g><g class="wave w1"><path d="${wave}" transform="translate(0 5)"/></g></g></g>
    <path class="handle" d="M164 44h8a24 24 0 0 1 0 48h-8"/>
    <path class="outline" d="M36 20H164V90C164 130 140 160 100 160C60 160 36 130 36 90Z"/>
    <path class="shine" d="M52 40V88"/>
    <path class="stream" pathLength="100" d="M100 -34C100 0 100 40 100 150"/>
  </svg>`;
  return d.firstElementChild;
}
function mountCup(host) { host.replaceChildren(cupEl()); return host; }
function setLevel(total) { $('cup').style.setProperty('--lvl', Math.min(1, total / LIMIT).toFixed(3)); }

/* ---------- Effekte ---------- */
function burst(x, y, label) {
  const f = $('fx');
  if (!REDUCED) for (let i = 0; i < 18; i++) {
    const b = h('i', { class: 'bean' }), a = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 140;
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.setProperty('--dx', Math.cos(a) * dist + 'px'); b.style.setProperty('--dy', Math.sin(a) * dist - 40 + 'px');
    b.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    f.append(b); setTimeout(() => b.remove(), 1100);
  }
  if (label) { const p = h('span', { class: 'plus', text: label }); p.style.left = x + 'px'; p.style.top = y + 'px'; f.append(p); setTimeout(() => p.remove(), 1400); }
}

/* ---------- Ansichten ---------- */
function showAuth(name) {
  ['login', 'forgot', 'reset', 'done'].forEach((n) => {
    const c = $('card-' + n), on = n === name; c.hidden = !on;
    if (on) { c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap'); }
  });
}
function show(loggedIn, name) {
  state.loggedIn = loggedIn;
  $('auth-view').hidden = loggedIn; $('app-view').hidden = !loggedIn; $('userbox').hidden = !loggedIn; $('chaos').hidden = !loggedIn;
  $('who').textContent = name || ''; $('who2').textContent = name || '';
  document.body.classList.remove('booting');
  if (!loggedIn) { Chaos.stop(); setChaosUI(); }
  if (loggedIn) { requestAnimationFrame(moveAll); Chaos.preload(); }
}
async function enter(user) {
  const p = ok(await sb.from('profiles').select('username').eq('id', user.id).single());
  state.username = p.username; state.unlocked = false; state.total = 0; show(true, p.username);
  $('dash').classList.add('is-loading'); $('list').replaceChildren(h('li', { class: 'sk-row' }), h('li', { class: 'sk-row' }));
  await loadDrinks(); await refresh();
}

/* ---------- Tabs mit gleitendem Marker ---------- */
function moveInd(nav) {
  const b = nav.querySelector('[aria-selected="true"]'), ind = nav.querySelector('.tab-ind');
  if (!b || !b.offsetWidth) return;
  ind.style.setProperty('--x', b.offsetLeft + 'px'); ind.style.setProperty('--w', b.offsetWidth + 'px');
}
const moveAll = () => document.querySelectorAll('.tabs').forEach(moveInd);
window.addEventListener('resize', moveAll);
function select(nav, btn) { nav.querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === btn))); moveInd(nav); }
document.querySelectorAll('#main-tabs [role="tab"]').forEach((b) => b.onclick = () => {
  select($('main-tabs'), b); state.tab = b.dataset.tab;
  document.querySelectorAll('.tab').forEach((x) => x.hidden = x.id !== 'tab-' + b.dataset.tab);
  moveAll(); if (b.dataset.tab === 'board') loadBoard();
});
document.querySelectorAll('#seg [role="tab"]').forEach((b) => b.onclick = () => { state.period = b.dataset.p; select($('seg'), b); loadBoard(); });

/* ---------- Sprache ---------- */
function applyAuthMode() {
  const reg = state.mode === 'register';
  $('auth-title').dataset.i18n = reg ? 'auth_title_reg' : 'auth_title_login'; $('auth-sub').dataset.i18n = reg ? 'auth_sub_reg' : 'auth_sub_login';
  $('auth-btn-t').dataset.i18n = reg ? 'btn_register' : 'btn_login'; $('toggle').dataset.i18n = reg ? 'toggle_to_login' : 'toggle_to_reg';
  $('user-row').hidden = !reg; $('u').required = reg; $('forgot-link').hidden = reg; $('strength').hidden = !reg;
  $('p').autocomplete = reg ? 'new-password' : 'current-password';
}
function rerender() {
  applyAuthMode(); applyStatic(); setChaosUI();
  document.querySelectorAll('[data-toggle-pw]').forEach((b) => { const shown = $(b.dataset.togglePw).type === 'text'; b.setAttribute('aria-label', t(shown ? 'hide_pw' : 'show_pw')); });
  if (state.loggedIn) { renderDrinks(); renderDash(); if (state.tab === 'board' && state.rows) renderBoard(state.rows); requestAnimationFrame(moveAll); }
  Chaos.relabel();
}
$('lang').onclick = () => { LANG = LANG === 'de' ? 'en' : 'de'; try { localStorage.setItem('kr-lang', LANG); } catch {} rerender(); };

/* ---------- Anmelden / Registrieren ---------- */
function strength(p) {
  let s = 0; if (p.length >= 10) s++; if (p.length >= 14) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return p ? Math.max(1, s) : 0;
}
$('p').addEventListener('input', () => { $('strength').dataset.s = strength($('p').value); });
document.querySelectorAll('[data-toggle-pw]').forEach((b) => b.onclick = () => {
  const i = $(b.dataset.togglePw), shown = i.type === 'password';
  i.type = shown ? 'text' : 'password'; b.replaceChildren(ico(shown ? 'eye-off' : 'eye')); b.setAttribute('aria-label', t(shown ? 'hide_pw' : 'show_pw'));
});
$('toggle').onclick = () => {
  state.mode = state.mode === 'login' ? 'register' : 'login'; applyAuthMode(); applyStatic(); msg('auth-msg');
  const c = $('card-login'); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap');
};
$('auth-form').onsubmit = async (e) => {
  e.preventDefault(); msg('auth-msg');
  const email = $('e').value.trim(), password = $('p').value;
  await busy($('auth-btn'), async () => {
    try {
      if (!email) throw new Error(t('e_email_req'));
      if (state.mode === 'register') {
        const username = $('u').value.trim();
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new Error(t('e_username'));
        if (password.length < 10) throw new Error(t('e_pw_len'));
        if (!$('hp').value) // Honeypot: Bots füllen das versteckte Feld aus und bekommen nur eine Schein-Antwort
          ok(await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: window.SITE_URL } }));
        $('p').value = ''; showAuth('done');
      } else {
        if (!password) throw new Error(t('e_pw_req'));
        const d = ok(await sb.auth.signInWithPassword({ email, password }));
        $('p').value = ''; await enter(d.user);
      }
    } catch (err) { msg('auth-msg', err.message); }
  });
};
const logout = async () => { await sb.auth.signOut(); show(false); showAuth('login'); toast(t('bye')); };
$('logout').onclick = logout; $('logout2').onclick = logout;

/* ---------- Passwort vergessen / zurücksetzen ---------- */
$('forgot-link').onclick = () => { showAuth('forgot'); msg('forgot-msg'); };
document.querySelectorAll('.back').forEach((b) => b.onclick = () => showAuth('login'));
$('forgot-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try { await sb.auth.resetPasswordForEmail($('fe').value.trim(), { redirectTo: window.SITE_URL }); msg('forgot-msg', t('forgot_ok'), true); } // Antwort ist immer gleich
    catch { msg('forgot-msg', t('e_generic')); }
  });
};
$('reset-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      const d = ok(await sb.auth.updateUser({ password: $('rp').value }));
      $('rp').value = ''; history.replaceState(null, '', location.pathname); await enter(d.user); toast(t('pw_saved'));
    } catch (err) { msg('reset-msg', err.message); }
  });
};

/* ---------- Konto löschen (Edge Function, prüft das Passwort erneut) ---------- */
$('del-open').onclick = () => { msg('del-msg'); $('del-pw').value = ''; $('del-dialog').showModal(); $('del-pw').focus(); };
$('del-cancel').onclick = () => $('del-dialog').close();
$('del-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      await fn('delete-account', { password: $('del-pw').value });
      $('del-pw').value = ''; $('del-dialog').close(); await sb.auth.signOut(); show(false); showAuth('login'); toast(t('del_done'));
    } catch (err) { msg('del-msg', err.message); }
  });
};

/* ---------- Dashboard ---------- */
const drinkIcon = (n) => /tee|matcha/i.test(n) ? 'leaf' : /energy|monster|red ?bull|rockstar/i.test(n) ? 'zap' : /cola|pepsi|limo/i.test(n) ? 'drop' : /schoko|chocolate/i.test(n) ? 'heart' : 'coffee';
async function loadDrinks() {
  state.drinks = ok(await sb.from('drinks').select('id,name,mg,portion').order('name'));
  state.selected = null; state.amount = null; state.custom = false; renderDrinks();
}
function renderDrinks() {
  const box = $('drinks'); box.replaceChildren();
  state.drinks.forEach((d, i) => {
    const on = d.id === state.selected;
    const tile = h('button', { class: 'drink', type: 'button', role: 'radio', 'aria-checked': String(on), tabindex: on || (state.selected == null && i === 0) ? '0' : '-1' },
      h('span', { class: 'd-ico' }, ico(drinkIcon(d.name))), h('span', { class: 'd-name', text: drinkName(d.name) }), h('span', { class: 'd-sub', text: d.portion }),
      h('span', { class: 'd-mg' }, String(d.mg), ' ', h('small', { text: 'mg' })));
    tile.style.setProperty('--i', i);
    tile.onclick = () => pick(d.id);
    tile.onkeydown = (ev) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key]; if (!k) return;
      ev.preventDefault(); pick(state.drinks[(i + k + state.drinks.length) % state.drinks.length].id, true);
    };
    box.append(tile);
  });
  if (!state.drinks.length) box.append(h('p', { class: 'hint', text: t('no_drinks') }));
  renderSizes(false); renderSelection();
}
/* Menge: Standardportion kommt aus der Datenbank ("200 ml"). mg wird proportional umgerechnet, der Server rechnet identisch nach. */
function portionOf(d) { const m = /^\s*(\d+)\s*(\D*)/.exec(d.portion) || []; return { base: Number(m[1]) || 0, unit: (m[2] || 'ml').trim() || 'ml' }; }
const r25 = (x) => Math.max(5, Math.round(x / 25) * 25);
function sizesFor(base) { return base <= 0 ? [] : base <= 60 ? [base, base * 2, base * 3] : [r25(base * .75), base, r25(base * 1.5)]; }
const mgFor = (d, amount) => { const { base } = portionOf(d); return base ? Math.round(d.mg * amount / base) : d.mg; };
const validAmount = (v) => Number.isInteger(v) && v >= 1 && v <= 2000;
function pick(id, focus) {
  state.selected = id; const d = state.drinks.find((x) => x.id === id); state.amount = d ? portionOf(d).base || null : null; state.custom = false;
  $('drinks').querySelectorAll('.drink').forEach((tile, i) => {
    const on = state.drinks[i].id === id; tile.setAttribute('aria-checked', String(on)); tile.tabIndex = on ? 0 : -1; if (on && focus) tile.focus();
  });
  renderSizes(true); renderSelection();
}
function renderSizes(animate) {
  const d = state.drinks.find((x) => x.id === state.selected), box = $('sizes'), grid = $('size-grid');
  box.hidden = !d; if (!d) return;
  const { base, unit } = portionOf(d); $('size-name').textContent = drinkName(d.name);
  grid.replaceChildren();
  sizesFor(base).forEach((amt, i) => {
    const on = !state.custom && state.amount === amt;
    const b = h('button', { class: 'size-opt', type: 'button', role: 'radio', 'aria-checked': String(on) },
      h('span', { class: 'so-ico s' + i }, ico('coffee')),
      h('span', { class: 'so-amt' }, String(amt), ' ', h('small', { text: unit })),
      h('span', { class: 'so-mg', text: `≈ ${mgFor(d, amt)} mg` }), amt === base ? h('span', { class: 'tag', text: t('size_std') }) : null);
    b.style.setProperty('--i', i);
    b.onclick = () => { state.amount = amt; state.custom = false; const ci = grid.querySelector('.custom input'); if (ci) ci.value = ''; markSizes(); renderSelection(); };
    grid.append(b);
  });
  const inp = h('input', { type: 'number', min: '1', max: '2000', step: '1', inputmode: 'numeric', 'aria-label': `${t('size_custom')} (${unit})`, placeholder: t('size_custom_ph') });
  if (state.custom && state.amount) inp.value = state.amount;
  const cust = h('label', { class: 'size-opt custom', 'aria-checked': String(state.custom) },
    h('span', { class: 'so-ico s3' }, ico('plus')), h('span', { class: 'so-in' }, inp, h('em', { text: unit })), h('span', { class: 'so-mg', id: 'cust-mg', text: t('size_custom') }));
  cust.style.setProperty('--i', 3);
  inp.oninput = () => {
    const v = inp.value === '' ? NaN : Number(inp.value); state.custom = true; state.amount = validAmount(v) ? v : null;
    $('cust-mg').textContent = state.amount ? `≈ ${mgFor(d, state.amount)} mg` : t('size_custom'); markSizes(); renderSelection();
  };
  inp.onfocus = () => { if (inp.value !== '') { state.custom = true; const v = Number(inp.value); state.amount = validAmount(v) ? v : null; markSizes(); renderSelection(); } };
  grid.append(cust);
  if (animate) { box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); }
}
function markSizes() {
  const grid = $('size-grid'), d = state.drinks.find((x) => x.id === state.selected); if (!d) return;
  grid.querySelectorAll('button.size-opt').forEach((b, i) => b.setAttribute('aria-checked', String(!state.custom && sizesFor(portionOf(d).base)[i] === state.amount)));
  grid.querySelector('.custom').setAttribute('aria-checked', String(state.custom));
}
function renderSelection() {
  const d = state.drinks.find((x) => x.id === state.selected), sum = $('preview'); sum.replaceChildren();
  if (d && state.amount) sum.append(h('b', { text: drinkName(d.name) }), h('small', { text: t('sum_detail', { amount: state.amount, unit: portionOf(d).unit, mg: mgFor(d, state.amount) }) }));
  else if (d) sum.append(h('b', { text: drinkName(d.name) }), h('small', { text: t('amount_invalid') }));
  else sum.textContent = t('pick_hint');
  $('add').disabled = !d || !state.amount;
}
const unitOfName = (n) => { const d = state.drinks.find((x) => x.name === n); return d ? portionOf(d).unit : 'ml'; };
function statusFor(total) {
  const p = total / LIMIT;
  if (total === 0) return ['sun', t('status0')];
  if (p < .25) return ['coffee', t('s25')]; if (p < .5) return ['coffee', t('s50')];
  if (p < .75) return ['pulse', t('s75')]; if (p < 1) return ['alert', t('s100')];
  return ['alert', t('sover')];
}
async function refresh(newest) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  state.items = ok(await sb.from('intakes').select('id,name,mg,amount,ts').gte('ts', start.toISOString()).order('ts', { ascending: false }));
  renderDash(newest, true);
}
function renderDash(newest, animate) {
  const items = state.items, total = items.reduce((s, i) => s + i.mg, 0), over = total > LIMIT, pct = Math.min(1, total / LIMIT), prev = state.total;
  if (!$('cup').firstChild) mountCup($('cup'));
  $('dash').classList.remove('is-loading');
  countTo($('total'), total); countTo($('remaining'), over ? total - LIMIT : LIMIT - total);
  $('ll-pre').textContent = t(over ? 'over_pre' : 'left_pre'); $('ll-post').textContent = t(over ? 'over_post' : 'left_post');
  const run = () => { setLevel(total); $('track').style.setProperty('--p', pct); };
  if (state.cupReady) run(); else { requestAnimationFrame(() => requestAnimationFrame(run)); state.cupReady = true; }
  $('track').classList.toggle('over', over); $('track').setAttribute('aria-valuenow', total); $('cup').classList.toggle('over', over);
  const [ic, text] = statusFor(total), pill = $('pill');
  pill.querySelector('svg').replaceWith(ico(ic)); $('warn').textContent = text; pill.classList.toggle('over', total >= LIMIT);
  if (animate) { pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop'); }
  if (animate && over && prev <= LIMIT) { $('cup').classList.remove('shake'); void $('cup').offsetWidth; $('cup').classList.add('shake'); }
  state.total = total; updateChaosGate(total, animate);

  $('count').textContent = items.length ? `${items.length} ${t(items.length === 1 ? 'count_one' : 'count_many')}` : '';
  const ul = $('list'); ul.replaceChildren();
  if (!items.length) {
    const art = document.createElement('div');
    art.innerHTML = '<svg class="art" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="st" d="M24 40h56v28a22 22 0 0 1-22 22h-12a22 22 0 0 1-22-22Z"/><path d="M80 48h6a12 12 0 0 1 0 24h-6"/><path d="M40 20v8M52 16v12M64 20v8"/></svg>';
    ul.append(h('li', { class: 'empty' }, art.firstElementChild, h('h3', { text: t('empty_title') }), h('p', { text: t('empty_text') })));
  }
  items.forEach((i) => {
    const x = h('button', { class: 'icon-btn', type: 'button', 'aria-label': `${drinkName(i.name)} ${t('remove')}`, title: t('remove') }, ico('x'));
    const li = h('li', { class: i.id === newest ? 'new' : '' },
      h('span', { class: 'time', text: new Date(i.ts).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) }),
      h('span', { class: 'nm' }, drinkName(i.name), i.amount ? h('small', { class: 'amt', text: ` · ${i.amount} ${unitOfName(i.name)}` }) : null), h('span', { class: 'mg', text: i.mg + ' mg' }), x);
    x.onclick = async () => {
      try { ok(await sb.from('intakes').delete().eq('id', i.id)); li.classList.add('leaving'); await sleep(280); await refresh(); toast(t('removed')); }
      catch (err) { toast(err.message, 'err'); }
    };
    ul.append(li);
  });
}
$('add').onclick = async () => {
  const d = state.drinks.find((x) => x.id === state.selected); if (!d || !state.amount) return;
  const btn = $('add'), amount = state.amount, mg = mgFor(d, amount); btn.disabled = true;
  try {
    ok(await sb.rpc('add_intake', { p_drink_id: Number(state.selected), p_amount: amount }));
    await playLoader();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data } = await sb.from('intakes').select('id').gte('ts', start.toISOString()).order('ts', { ascending: false }).limit(1);
    await refresh(data && data[0] && data[0].id);
    const r = $('cup').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .35, `+${mg} mg`);
    toast(t('added', { name: drinkName(d.name) }));
  } catch (err) { $('loader').classList.remove('on'); toast(err.message, 'err'); }
  finally { btn.disabled = !state.selected || !state.amount; }
};
// Zufällig, aber ohne Wiederholung: erst wenn alle durch sind, wird neu gemischt; der erste der neuen Runde ist nie der letzte alte
let factBag = [], lastFact = -1; try { lastFact = Number(localStorage.getItem('kr-lastfact')); if (!Number.isInteger(lastFact)) lastFact = -1; } catch { lastFact = -1; }
function nextFact() {
  const list = FACTS[LANG];
  if (!factBag.length) {
    factBag = list.map((_, i) => i);
    for (let i = factBag.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [factBag[i], factBag[k]] = [factBag[k], factBag[i]]; }
    if (factBag[factBag.length - 1] === lastFact && factBag.length > 1) { const k = Math.floor(Math.random() * (factBag.length - 1)); [factBag[factBag.length - 1], factBag[k]] = [factBag[k], factBag[factBag.length - 1]]; }
  }
  lastFact = factBag.pop(); try { localStorage.setItem('kr-lastfact', String(lastFact)); } catch { /* egal */ }
  return list[lastFact];
}
async function playLoader() {
  const f = nextFact(), L = $('loader');
  $('ld-fact').replaceChildren(h('span', { class: 'ld-ico' }, ico(f.i)), h('h3', { text: f.t }), h('p', { text: f.x }));
  mountCup($('ld-cup')); L.setAttribute('aria-hidden', 'false'); L.classList.add('on');
  await sleep(3500);
  L.classList.remove('on'); L.setAttribute('aria-hidden', 'true'); await sleep(REDUCED ? 0 : 450);
}

/* ---------- CHAOS MODE: Freischaltung + Umschalter ---------- */
function setChaosUI() {
  const b = $('chaos'), locked = !state.unlocked, active = Chaos.on;
  b.dataset.locked = String(locked); b.setAttribute('aria-pressed', String(active));
  $('chaos-t').dataset.i18n = active ? 'chaos_stop' : 'chaos_btn'; $('chaos-t').textContent = t(active ? 'chaos_stop' : 'chaos_btn');
  b.style.setProperty('--p', Math.min(1, state.total / UNLOCK).toFixed(3));
  b.title = locked ? t('chaos_locked', { mg: UNLOCK, left: Math.max(0, UNLOCK - state.total) }) : t('chaos_aria');
  b.setAttribute('aria-label', b.title);
}
function updateChaosGate(total, animate) {
  const was = state.unlocked; state.unlocked = total >= UNLOCK;
  if (state.unlocked && !was && animate) {
    toast(t('chaos_unlocked'));
    const b = $('chaos'); b.classList.remove('unlock-pop'); void b.offsetWidth; b.classList.add('unlock-pop');
    const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
  }
  if (!state.unlocked && Chaos.on) { Chaos.stop(); toast(t('chaos_lost')); }
  setChaosUI();
}
function activateChaos() {
  Chaos.start(); setChaosUI(); if (REDUCED) toast(t('chaos_reduced'));
  const r = $('chaos').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 'CHAOS!');
}
$('chaos').onclick = () => {
  if (!state.unlocked) {
    toast(t('chaos_locked', { mg: UNLOCK, left: Math.max(0, UNLOCK - state.total) }), 'err');
    const b = $('chaos'); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return;
  }
  if (Chaos.on) { Chaos.stop(); setChaosUI(); return; }
  if (!state.warned) { $('chaos-dialog').showModal(); return; }
  activateChaos();
};
$('chaos-cancel').onclick = () => $('chaos-dialog').close();
$('chaos-go').onclick = () => { state.warned = true; $('chaos-dialog').close(); activateChaos(); };
$('mute').onclick = () => Chaos.toggleMute();
$('skip').onclick = () => Chaos.skip();

/* ---------- Rangliste ---------- */
async function loadBoard() {
  const box = $('board'), token = ++loadBoard.n;
  box.replaceChildren(...[0, 1, 2, 3, 4].map(() => h('div', { class: 'sk-row' })));
  let rows;
  try { rows = ok(await sb.rpc('leaderboard', { p_period: state.period })); }
  catch (err) {
    if (token === loadBoard.n) box.replaceChildren(h('div', { class: 'empty' }, h('h3', { text: t('board_err') }), h('p', { text: err.message }),
      h('button', { class: 'btn ghost', type: 'button', onclick: loadBoard }, h('span', { text: t('retry') }))));
    return;
  }
  if (token !== loadBoard.n) return;
  state.rows = rows; renderBoard(rows);
}
loadBoard.n = 0;
function renderBoard(rows) {
  const box = $('board'); box.replaceChildren();
  if (!rows.length) {
    const e = h('div', { class: 'empty' }, ico('trophy'), h('h3', { text: t('board_empty_t') }), h('p', { text: t('board_empty_x') })); e.firstChild.classList.add('art'); box.append(e); return;
  }
  const max = Math.max(...rows.map((r) => r.total), 1), top = rows.slice(0, 3), pod = h('div', { class: 'podium' }), names = ['first', 'second', 'third'];
  [1, 0, 2].forEach((idx) => {
    const r = top[idx]; if (!r) { pod.append(h('div')); return; }
    const el = h('div', { class: `pod ${names[idx]}${r.username === state.username ? ' me' : ''}` },
      idx === 0 ? h('span', { class: 'crown' }, ico('crown')) : null, h('span', { class: 'av', text: r.username.charAt(0) }),
      h('span', { class: 'nm', text: r.username }), h('span', { class: 'mgv', text: r.total + ' mg' }), h('span', { class: 'bar', text: String(idx + 1) }));
    el.style.setProperty('--i', idx === 0 ? 2 : idx === 1 ? 1 : 0); pod.append(el);
  });
  box.append(pod);
  const ol = h('ol', { class: 'rank' });
  rows.slice(3).forEach((r, i) => {
    const me = r.username === state.username, fb = h('i'); fb.style.setProperty('--p', (r.total / max).toFixed(3));
    const li = h('li', { class: me ? 'me' : '' }, h('span', { class: 'n', text: String(i + 4) }),
      h('span', { class: 'who' }, h('b', { text: r.username }, me ? h('span', { class: 'badge', text: t('you') }) : null), h('span', { class: 'fb' }, fb)),
      h('span', { class: 'v', text: r.total + ' mg' }));
    li.style.setProperty('--i', i); ol.append(li);
  });
  if (rows.length > 3) box.append(ol);
}

/* ---------- Vorschlag ---------- */
$('sg-form').onsubmit = async (e) => {
  e.preventDefault(); msg('sg-msg');
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try { await fn('suggest-drink', { name: $('sg-name').value, portion: $('sg-portion').value, mg: $('sg-mg').value }); msg('sg-msg'); e.target.reset(); toast(t('sg_ok')); }
    catch (err) { msg('sg-msg', err.message); }
  });
};

addEventListener('offline', () => toast(t('offline'), 'err'));
addEventListener('online', () => toast(t('online')));

/* ---------- Start ---------- */
applyAuthMode(); applyStatic(); mountCup($('hero-cup')); renderSelection();
(async () => {
  try {
    if (recovery) { show(false); return showAuth('reset'); }
    const { data: { session } } = await sb.auth.getSession();
    if (session) await enter(session.user).catch(() => show(false)); else show(false);
  } catch { show(false); }
})();
setTimeout(() => document.body.classList.remove('booting'), 6000);

// Esc beendet den Rave sofort (der Dialog schließt sich bei Esc ohnehin selbst)
addEventListener('keydown', (e) => { if (e.key === 'Escape' && Chaos.on) { Chaos.stop(); setChaosUI(); } });
// Schalter für Effekte trotz "weniger Bewegung" im System
(() => {
  const box = $('fx-box'), b = $('fx-toggle'); if (!box || !SYSTEM_REDUCED) return;
  box.hidden = false;
  const label = () => { b.textContent = t(FX_FORCE ? 'fx_off' : 'fx_on'); };
  label(); b.onclick = () => { try { if (FX_FORCE) localStorage.removeItem('kr-fx'); else localStorage.setItem('kr-fx', 'on'); } catch { /* egal */ } location.reload(); };
})();

// Musik: Playlist wählen, versteckte Playlist mit Code freischalten
(() => {
  const sel = $('pl-select'); if (!sel) return;
  const fill = () => {
    const cur = Chaos.plId; sel.replaceChildren();
    const add = (v, txt) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; sel.append(o); };
    add('all', t('mus_all')); Chaos.lists().forEach((l) => add(l.id, l.name + ' (' + l.tracks.length + ')')); add('synth', t('mus_synth'));
    sel.value = [...sel.options].some((o) => o.value === cur) ? cur : 'all';
    $('nsfw-form').hidden = Chaos.unlocked; $('nsfw-lock').hidden = !Chaos.unlocked;
  };
  Chaos.onChange(fill); Chaos.preload().then(fill); fill();
  sel.onchange = () => Chaos.setPlaylist(sel.value);
  $('nsfw-form').onsubmit = async (e) => {
    e.preventDefault(); const code = $('nsfw-code').value; if (!code) return;
    if (!(window.crypto && crypto.subtle)) return msg('nsfw-msg', t('mus_nocrypto'));
    await Chaos.preload(); const okc = await Chaos.unlock(code); $('nsfw-code').value = '';
    msg('nsfw-msg', okc ? t('mus_ok') : t('mus_bad'), okc); if (okc) { fill(); sel.value = 'nsfw'; Chaos.setPlaylist('nsfw'); }
  };
  $('nsfw-lock').onclick = () => { Chaos.lock(); msg('nsfw-msg'); fill(); };
})();
