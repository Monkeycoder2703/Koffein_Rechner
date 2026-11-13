'use strict';
const $ = (id) => document.getElementById(id);
const API = (window.API_BASE || '').replace(/\/$/, '');
const FACTS = [
  'Koffein erreicht nach ca. 30–60 Minuten die höchste Konzentration im Blut.',
  'Die Halbwertszeit liegt bei etwa 5 Stunden: Nach 5 h ist noch die Hälfte aktiv.',
  'Bis 400 mg pro Tag gelten für gesunde Erwachsene als unbedenklich (EFSA).',
  'Einzeldosen über 200 mg sollten vermieden werden.',
  'Schwangere sollten höchstens 200 mg pro Tag zu sich nehmen.',
  'Koffein spät am Tag verkürzt und stört den Tiefschlaf, auch wenn du gut einschläfst.',
  'Zu viel Koffein kann Herzklopfen, Unruhe, Zittern und Magenprobleme verursachen.',
  'Koffein blockiert Adenosin-Rezeptoren. Das Müdigkeitssignal wird nur verdeckt, nicht abgebaut.',
  'Regelmäßiger Konsum führt zur Gewöhnung. Beim Absetzen drohen Kopfschmerzen.',
  'Energy Drinks enthalten oft mehr Koffein als eine Tasse Kaffee, plus viel Zucker.'
];
let mode = 'login', period = 'day', drinks = [], resetToken = null;

async function api(path, method = 'GET', body) {
  const opt = { method, headers: { 'X-Requested-With': 'koffein' }, credentials: 'include' };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(API + '/api/' + path, opt);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Fehler');
  return data;
}
const msg = (id, t, ok) => { const e = $(id); e.textContent = t || ''; e.className = ok ? 'ok' : 'err'; };
function row(ul, left, right, extra) {
  const li = document.createElement('li');
  const a = document.createElement('span'); a.textContent = left;
  const b = document.createElement('span'); b.textContent = right;
  li.append(a, b); if (extra) li.append(extra); ul.append(li);
}
function showAuth(name) { ['login', 'forgot', 'reset'].forEach((n) => $('card-' + n).hidden = n !== name); }
function show(loggedIn, name) {
  $('auth-view').hidden = loggedIn; $('app-view').hidden = !loggedIn; $('userbox').hidden = !loggedIn; $('who').textContent = name || '';
}

// ---- Anmelden / Registrieren ----
$('toggle').onclick = () => {
  mode = mode === 'login' ? 'register' : 'login';
  const reg = mode === 'register';
  $('auth-title').textContent = $('auth-btn').textContent = reg ? 'Registrieren' : 'Anmelden';
  $('toggle').textContent = reg ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren';
  $('email-row').hidden = !reg; $('e').required = reg; $('forgot-link').hidden = reg;
  $('p').autocomplete = reg ? 'new-password' : 'current-password'; msg('auth-msg');
};
$('auth-form').onsubmit = async (e) => {
  e.preventDefault(); msg('auth-msg');
  try {
    if (mode === 'register') {
      await api('register', 'POST', { username: $('u').value, email: $('e').value, password: $('p').value, website: $('hp').value });
      $('p').value = '';
      msg('auth-msg', 'Fast geschafft! Wir haben dir eine E-Mail geschickt. Klicke den Link darin (24 h gültig), dann kannst du dich anmelden.', true);
    } else {
      const r = await api('login', 'POST', { username: $('u').value, password: $('p').value });
      $('p').value = ''; await enter(r.username);
    }
  } catch (err) { msg('auth-msg', err.message); }
};
$('logout').onclick = async () => { await api('logout', 'POST').catch(() => {}); show(false); showAuth('login'); };

// ---- Passwort vergessen / zurücksetzen ----
$('forgot-link').onclick = () => { showAuth('forgot'); msg('forgot-msg'); };
document.querySelector('.back').onclick = () => showAuth('login');
$('forgot-form').onsubmit = async (e) => {
  e.preventDefault();
  try { await api('forgot', 'POST', { email: $('fe').value }); msg('forgot-msg', 'Falls ein Konto mit dieser Adresse existiert, haben wir einen Link geschickt (1 Stunde gültig).', true); }
  catch (err) { msg('forgot-msg', err.message); }
};
$('reset-form').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api('reset', 'POST', { token: resetToken, password: $('rp').value });
    $('rp').value = ''; showAuth('login'); msg('auth-msg', 'Passwort geändert. Du kannst dich jetzt anmelden.', true);
  } catch (err) { msg('reset-msg', err.message); }
};

// ---- Konto löschen ----
$('del-form').onsubmit = async (e) => {
  e.preventDefault();
  if (!confirm('Konto und alle Daten endgültig löschen?')) return;
  try {
    await api('account/delete', 'POST', { password: $('del-pw').value });
    $('del-pw').value = ''; show(false); showAuth('login'); msg('auth-msg', 'Dein Konto wurde gelöscht.', true);
  } catch (err) { msg('del-msg', err.message); }
};

async function enter(name) { show(true, name); await loadDrinks(); await refresh(); }

// ---- Dashboard ----
async function loadDrinks() {
  drinks = await api('drinks'); const s = $('drink'); s.replaceChildren();
  drinks.forEach((d) => { const o = document.createElement('option'); o.value = d.id; o.textContent = `${d.name} (${d.portion})`; s.append(o); });
  preview();
}
function preview() { const d = drinks.find((x) => String(x.id) === $('drink').value); $('preview').textContent = d ? `Enthält ca. ${d.mg} mg Koffein` : ''; }
$('drink').onchange = preview;
async function refresh() {
  const d = await api('dashboard');
  $('total').textContent = d.total; $('remaining').textContent = d.remaining;
  const pct = Math.min(100, d.total / d.limit * 100);
  $('fill').style.width = pct + '%'; $('fill').style.background = pct >= 100 ? 'var(--bad)' : pct >= 75 ? '#ef6c00' : 'var(--ok)';
  $('warn').textContent = d.total > d.limit ? 'Tageslimit überschritten! Verzichte für heute auf weiteres Koffein.' : '';
  const ul = $('list'); ul.replaceChildren();
  d.items.forEach((i) => {
    const x = document.createElement('button'); x.className = 'ghost'; x.textContent = '✕'; x.setAttribute('aria-label', i.name + ' entfernen');
    x.onclick = async () => { await api('intakes/' + i.id, 'DELETE'); refresh(); };
    row(ul, `${new Date(i.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} ${i.name}`, i.mg + ' mg', x);
  });
}
$('add').onclick = async () => {
  try {
    await api('intakes', 'POST', { drink_id: Number($('drink').value) });
    $('fact').textContent = FACTS[Math.floor(Math.random() * FACTS.length)];
    $('loader').hidden = false;
    await new Promise((r) => setTimeout(r, 3500));
    $('loader').hidden = true; await refresh();
  } catch (err) { $('loader').hidden = true; alert(err.message); }
};

// ---- Tabs, Leaderboard, Vorschlag ----
document.querySelectorAll('nav button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.hidden = t.id !== 'tab-' + b.dataset.tab);
  if (b.dataset.tab === 'board') loadBoard();
});
document.querySelectorAll('.seg button').forEach((b) => b.onclick = () => {
  period = b.dataset.p; document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b)); loadBoard();
});
async function loadBoard() {
  const rows = await api('leaderboard?period=' + period), ol = $('board'); ol.replaceChildren();
  if (!rows.length) row(ol, 'Noch keine Einträge', '');
  rows.forEach((r) => row(ol, r.username, r.total + ' mg'));
}
$('sg-form').onsubmit = async (e) => {
  e.preventDefault(); msg('sg-msg');
  try {
    await api('suggest', 'POST', { name: $('sg-name').value, portion: $('sg-portion').value, mg: $('sg-mg').value });
    msg('sg-msg', 'Danke! Dein Vorschlag wurde gesendet.', true); e.target.reset();
  } catch (err) { msg('sg-msg', err.message); }
};

// ---- Start: Links aus E-Mails (#verify=… / #reset=…) auswerten ----
(async () => {
  const h = location.hash.match(/^#(verify|reset)=([a-f0-9]{64})$/);
  if (h) history.replaceState(null, '', location.pathname + location.search); // Token aus der Adresszeile entfernen
  if (h && h[1] === 'reset') { resetToken = h[2]; show(false); return showAuth('reset'); }
  if (h && h[1] === 'verify') {
    try { await api('verify', 'POST', { token: h[2] }); show(false); return msg('auth-msg', 'E-Mail bestätigt! Du kannst dich jetzt anmelden.', true); }
    catch (err) { show(false); return msg('auth-msg', err.message); }
  }
  api('me').then((r) => enter(r.username)).catch(() => show(false));
})();
