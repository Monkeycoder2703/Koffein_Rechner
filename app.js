'use strict';
const $ = (id) => document.getElementById(id);
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
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
const LIMIT = 400;
let mode = 'login', period = 'day', drinks = [];
const recovery = location.hash.includes('type=recovery'); // Link aus der "Passwort vergessen"-Mail

// Fehlertexte: nur bekannte Meldungen anzeigen, nichts Internes
const TXT = {
  'Invalid login credentials': 'E-Mail oder Passwort falsch.',
  'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse (Link in der Mail).',
  'Database error saving new user': 'Registrierung nicht möglich. Der Benutzername ist evtl. schon vergeben.',
  'Auth session missing!': 'Link ungültig oder abgelaufen. Bitte neu anfordern.',
  'New password should be different from the old password.': 'Das neue Passwort muss anders sein als das alte.'
};
function ok(res) {
  if (res.error) {
    const m = res.error.message || '';
    throw new Error(TXT[m] || (/rate limit|too many/i.test(m) ? 'Zu viele Anfragen. Bitte später erneut versuchen.' : 'Aktion fehlgeschlagen. Bitte erneut versuchen.'));
  }
  return res.data;
}
async function fn(name, body) { // Edge Function aufrufen
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) { let m = 'Aktion fehlgeschlagen.'; try { m = (await error.context.json()).error || m; } catch {} throw new Error(m); }
  return data;
}
const msg = (id, t, good) => { const e = $(id); e.textContent = t || ''; e.className = good ? 'ok' : 'err'; };
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
async function enter(user) {
  const p = ok(await sb.from('profiles').select('username').eq('id', user.id).single());
  show(true, p.username); await loadDrinks(); await refresh();
}

// ---- Anmelden / Registrieren ----
$('toggle').onclick = () => {
  mode = mode === 'login' ? 'register' : 'login';
  const reg = mode === 'register';
  $('auth-title').textContent = $('auth-btn').textContent = reg ? 'Registrieren' : 'Anmelden';
  $('toggle').textContent = reg ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren';
  $('user-row').hidden = !reg; $('u').required = reg; $('forgot-link').hidden = reg;
  $('p').autocomplete = reg ? 'new-password' : 'current-password'; msg('auth-msg');
};
$('auth-form').onsubmit = async (e) => {
  e.preventDefault(); msg('auth-msg');
  const email = $('e').value.trim(), password = $('p').value;
  try {
    if (mode === 'register') {
      const username = $('u').value.trim();
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new Error('Benutzername: 3–20 Zeichen (Buchstaben, Zahlen, _).');
      if (password.length < 10) throw new Error('Passwort: mindestens 10 Zeichen.');
      if (!$('hp').value) // Honeypot: Bots füllen das versteckte Feld aus und bekommen nur eine Schein-Antwort
        ok(await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: window.SITE_URL } }));
      $('p').value = '';
      msg('auth-msg', 'Fast geschafft! Wir haben dir eine E-Mail geschickt. Klicke den Link darin, dann bist du angemeldet.', true);
    } else {
      const d = ok(await sb.auth.signInWithPassword({ email, password }));
      $('p').value = ''; await enter(d.user);
    }
  } catch (err) { msg('auth-msg', err.message); }
};
$('logout').onclick = async () => { await sb.auth.signOut(); show(false); showAuth('login'); };

// ---- Passwort vergessen / zurücksetzen ----
$('forgot-link').onclick = () => { showAuth('forgot'); msg('forgot-msg'); };
document.querySelector('.back').onclick = () => showAuth('login');
$('forgot-form').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await sb.auth.resetPasswordForEmail($('fe').value.trim(), { redirectTo: window.SITE_URL }); // Antwort ist immer gleich
    msg('forgot-msg', 'Falls ein Konto mit dieser Adresse existiert, haben wir einen Link geschickt.', true);
  } catch { msg('forgot-msg', 'Aktion fehlgeschlagen. Bitte erneut versuchen.'); }
};
$('reset-form').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const d = ok(await sb.auth.updateUser({ password: $('rp').value }));
    $('rp').value = ''; history.replaceState(null, '', location.pathname); await enter(d.user);
  } catch (err) { msg('reset-msg', err.message); }
};

// ---- Konto löschen (Edge Function, prüft das Passwort erneut) ----
$('del-form').onsubmit = async (e) => {
  e.preventDefault();
  if (!confirm('Konto und alle Daten endgültig löschen?')) return;
  try {
    await fn('delete-account', { password: $('del-pw').value });
    $('del-pw').value = ''; await sb.auth.signOut(); show(false); showAuth('login');
    msg('auth-msg', 'Dein Konto wurde gelöscht.', true);
  } catch (err) { msg('del-msg', err.message); }
};

// ---- Dashboard ----
async function loadDrinks() {
  drinks = ok(await sb.from('drinks').select('id,name,mg,portion').order('name'));
  const s = $('drink'); s.replaceChildren();
  drinks.forEach((d) => { const o = document.createElement('option'); o.value = d.id; o.textContent = `${d.name} (${d.portion})`; s.append(o); });
  preview();
}
function preview() { const d = drinks.find((x) => String(x.id) === $('drink').value); $('preview').textContent = d ? `Enthält ca. ${d.mg} mg Koffein` : ''; }
$('drink').onchange = preview;
async function refresh() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const items = ok(await sb.from('intakes').select('id,name,mg,ts').gte('ts', start.toISOString()).order('ts', { ascending: false }));
  const total = items.reduce((s, i) => s + i.mg, 0);
  $('total').textContent = total; $('remaining').textContent = Math.max(0, LIMIT - total);
  const pct = Math.min(100, total / LIMIT * 100);
  $('fill').style.width = pct + '%'; $('fill').style.background = pct >= 100 ? 'var(--bad)' : pct >= 75 ? '#ef6c00' : 'var(--ok)';
  $('warn').textContent = total > LIMIT ? 'Tageslimit überschritten! Verzichte für heute auf weiteres Koffein.' : '';
  const ul = $('list'); ul.replaceChildren();
  items.forEach((i) => {
    const x = document.createElement('button'); x.className = 'ghost'; x.textContent = '✕'; x.setAttribute('aria-label', i.name + ' entfernen');
    x.onclick = async () => { ok(await sb.from('intakes').delete().eq('id', i.id)); refresh(); };
    row(ul, `${new Date(i.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} ${i.name}`, i.mg + ' mg', x);
  });
}
$('add').onclick = async () => {
  try {
    ok(await sb.rpc('add_intake', { p_drink_id: Number($('drink').value) }));
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
  const rows = ok(await sb.rpc('leaderboard', { p_period: period })), ol = $('board'); ol.replaceChildren();
  if (!rows.length) row(ol, 'Noch keine Einträge', '');
  rows.forEach((r) => row(ol, r.username, r.total + ' mg'));
}
$('sg-form').onsubmit = async (e) => {
  e.preventDefault(); msg('sg-msg');
  try {
    await fn('suggest-drink', { name: $('sg-name').value, portion: $('sg-portion').value, mg: $('sg-mg').value });
    msg('sg-msg', 'Danke! Dein Vorschlag wurde gesendet.', true); e.target.reset();
  } catch (err) { msg('sg-msg', err.message); }
};

// ---- Start ----
(async () => {
  if (recovery) { show(false); return showAuth('reset'); }
  const { data: { session } } = await sb.auth.getSession();
  if (session) enter(session.user).catch(() => show(false)); else show(false);
})();
