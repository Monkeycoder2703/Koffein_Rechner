'use strict';
/* Deutsch / Englisch. Neue Texte: Schlüssel in BEIDEN Sprachen eintragen. */
const $ = (id) => document.getElementById(id);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const I18N = {
de: {
  title: 'Koffein Rechner – Dein Tag in Tassen', meta_desc: 'Koffein Rechner: Trag deine Getränke ein und sieh, wie viel Koffein du heute schon hattest.',
  brand: 'Koffein Rechner', brand_aria: 'Koffein Rechner – Startseite', lang_aria: 'Switch to English', logout: 'Abmelden',
  eyebrow: 'Dein Koffein im Blick', h1a: 'Wie viele Tassen', h1b: 'waren es', h1c: 'heute?',
  pt1_t: 'Eintragen, fertig', pt1_x: 'Getränk antippen, Koffein wird automatisch gerechnet.',
  pt2_t: '400 mg Tageslimit', pt2_x: 'Die Tasse zeigt dir, wie voll du schon bist.',
  pt3_t: 'Rangliste', pt3_x: 'Wer trinkt heute am meisten? Nur mit Benutzernamen.',
  auth_title_login: 'Willkommen zurück', auth_title_reg: 'Konto erstellen',
  auth_sub_login: 'Melde dich an, um deinen Tag zu sehen.', auth_sub_reg: 'Dauert eine Minute. Danach bestätigst du nur noch deine E-Mail.',
  email: 'E-Mail', email_ph: 'du@beispiel.de', username: 'Benutzername', username_ph: 'z. B. koffeinfuchs',
  username_hint: 'Das sehen andere in der Rangliste. Bitte nicht deinen echten Namen.',
  password: 'Passwort', password_ph: 'mindestens 10 Zeichen', show_pw: 'Passwort anzeigen', hide_pw: 'Passwort verbergen',
  btn_login: 'Anmelden', btn_register: 'Registrieren',
  toggle_to_reg: 'Noch kein Konto? Registrieren', toggle_to_login: 'Schon ein Konto? Anmelden', forgot_link: 'Passwort vergessen?',
  fine_email: 'Deine E-Mail-Adresse sieht niemand sonst.',
  forgot_title: 'Passwort vergessen?', forgot_sub: 'Gib deine E-Mail ein. Wir schicken dir einen Link zum Zurücksetzen.', send_link: 'Link schicken', back_login: 'Zurück zur Anmeldung',
  reset_title: 'Neues Passwort', reset_sub: 'Wähle ein neues Passwort mit mindestens 10 Zeichen.', new_pw: 'Neues Passwort', save_pw: 'Passwort speichern',
  done_title: 'Schau in dein Postfach', done_sub: 'Wir haben dir eine E-Mail geschickt. Ein Klick auf den Link darin, und du bist drin. Nichts gefunden? Schau auch im Spam-Ordner.', to_login: 'Zur Anmeldung',
  tab_today: 'Heute', tab_board: 'Rangliste', tab_suggest: 'Vorschlag', tab_account: 'Konto', tabs_aria: 'Bereiche',
  what_drink: 'Was trinkst du?', pick_aria: 'Getränk wählen', pick_hint: 'Wähle ein Getränk.', add: 'Eintragen',
  today_h: 'Heute getrunken', count_one: 'Getränk', count_many: 'Getränke', progress_aria: 'Koffein heute',
  left_pre: 'Noch ', left_post: ' mg bis zum Tageslimit', over_pre: 'Du bist ', over_post: ' mg über dem Tageslimit',
  status0: 'Noch nichts getrunken. Die Tasse ist leer.', s25: 'Ruhiger Start. Da ist noch viel Luft.', s50: 'Gut dabei. Du bist im grünen Bereich.',
  s75: 'Über der Hälfte. Lass es langsam angehen.', s100: 'Fast am Limit. Vielleicht jetzt ein Wasser?', sover: 'Limit überschritten. Für heute ist es genug.',
  empty_title: 'Noch nichts getrunken', empty_text: 'Such dir oben ein Getränk aus. Dann füllt sich die Tasse.',
  remove: 'entfernen', removed: 'Eintrag entfernt.', added: '{name} eingetragen.', no_drinks: 'Gerade sind keine Getränke verfügbar.',
  size_h: 'Wie viel trinkst du?', size_custom: 'Eigene Menge', size_custom_ph: '275', size_std: 'Standard',
  amount_invalid: 'Bitte gib eine Menge von 1 bis 2000 ein.',
  sum_detail: '{amount} {unit} · ca. {mg} mg Koffein',
  offline: 'Keine Internetverbindung. Eintragen geht erst wieder online.', online: 'Wieder online.',
  board_h: 'Rangliste', board_sub: 'Wer ist am wachsten?', seg_aria: 'Zeitraum', p_day: 'Heute', p_week: 'Woche', p_month: 'Monat',
  board_empty_t: 'Noch niemand im Rennen', board_empty_x: 'Trag das erste Getränk ein und sei der oder die Erste ganz oben.', board_err: 'Rangliste nicht erreichbar', retry: 'Nochmal versuchen', you: 'Du',
  sg_title: 'Dein Lieblingsgetränk fehlt?', sg_sub: 'Schick uns einen Vorschlag. Wir schauen ihn uns an und nehmen ihn auf.',
  sg_name: 'Name des Getränks', sg_name_ph: 'z. B. Cold Brew', sg_portion: 'Portionsgröße', sg_portion_ph: 'z. B. 330 ml', sg_mg: 'Koffein in mg', sg_mg_ph: 'z. B. 120',
  sg_mg_hint: 'Steht oft auf der Verpackung oder der Website des Herstellers.', sg_send: 'Vorschlag senden', sg_ok: 'Danke! Dein Vorschlag ist angekommen.',
  acc_title: 'Dein Konto', acc_as: 'Angemeldet als ', del_title: 'Konto löschen',
  del_sub: 'Dein Konto und alle deine Einträge werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.', del_open: 'Konto löschen…',
  dlg_title: 'Wirklich löschen?', dlg_text: 'Zur Sicherheit brauchen wir noch einmal dein Passwort.', cancel: 'Abbrechen', del_confirm: 'Endgültig löschen', del_done: 'Dein Konto wurde gelöscht. Mach’s gut!',
  ld_kicker: 'Wird eingeschenkt…', bye: 'Bis bald! Du bist abgemeldet.', pw_saved: 'Neues Passwort gespeichert.',
  e_login: 'E-Mail oder Passwort stimmt nicht. Tippfehler?', e_confirm: 'Bitte bestätige zuerst deine E-Mail-Adresse. Der Link steckt in der Mail von uns.',
  e_signup: 'Das hat nicht geklappt. Vielleicht ist der Benutzername schon vergeben.', e_session: 'Dieser Link ist ungültig oder abgelaufen. Fordere bitte einen neuen an.',
  e_samepw: 'Das neue Passwort muss sich vom alten unterscheiden.', e_rate: 'Gerade zu viele Anfragen. Warte kurz und versuch es dann nochmal.',
  e_generic: 'Das hat leider nicht geklappt. Versuch es bitte gleich noch einmal.', e_email_req: 'Bitte gib deine E-Mail-Adresse ein.',
  e_username: 'Der Benutzername braucht 3 bis 20 Zeichen: Buchstaben, Zahlen oder _.', e_pw_len: 'Dein Passwort braucht mindestens 10 Zeichen.', e_pw_req: 'Bitte gib dein Passwort ein.',
  forgot_ok: 'Falls es ein Konto mit dieser Adresse gibt, ist der Link unterwegs.',
  chaos_btn: 'CHAOS', chaos_stop: 'STOPP', chaos_aria: 'Chaos Mode', chaos_locked: 'Chaos Mode ab {mg} mg Koffein. Noch {left} mg!',
  chaos_unlocked: 'CHAOS MODE freigeschaltet! Schau oben rechts.', chaos_lost: 'Chaos Mode beendet: du bist wieder unter der Hälfte.',
  warn_title: 'Achtung: Blinklichter', warn_text: 'Der Chaos Mode hat blinkende Lichter, schnelle Farbwechsel und laute Musik. Bei Lichtempfindlichkeit oder Epilepsie bitte nicht aktivieren.',
  warn_go: 'Los, Chaos!', music_mute: 'Musik an/aus', music_next: 'Nächster Song', now_playing: 'Läuft: ', synth_name: 'Eingebauter Chaos-Beat',
  chaos_reduced: 'Dein Gerät ist auf weniger Bewegung gestellt. Der Chaos Mode läuft deshalb ohne Blinken.',
  ticker: 'CHAOS MODE /// MEHR KOFFEIN /// MEHR LICHT /// MEHR CHAOS /// '
},
en: {
  title: 'Caffeine Counter – Your day in cups', meta_desc: 'Caffeine Counter: log your drinks and see how much caffeine you have had today.',
  brand: 'Caffeine Counter', brand_aria: 'Caffeine Counter – home', lang_aria: 'Auf Deutsch umstellen', logout: 'Log out',
  eyebrow: 'Your caffeine at a glance', h1a: 'How many cups', h1b: 'was it', h1c: 'today?',
  pt1_t: 'Log it, done', pt1_x: 'Tap a drink and the caffeine is calculated for you.',
  pt2_t: '400 mg daily limit', pt2_x: 'The cup shows you how full you already are.',
  pt3_t: 'Leaderboard', pt3_x: 'Who drinks the most today? Usernames only.',
  auth_title_login: 'Welcome back', auth_title_reg: 'Create account',
  auth_sub_login: 'Log in to see your day.', auth_sub_reg: 'Takes a minute. Then you only need to confirm your email.',
  email: 'Email', email_ph: 'you@example.com', username: 'Username', username_ph: 'e.g. caffeinefox',
  username_hint: 'Others see this on the leaderboard. Please not your real name.',
  password: 'Password', password_ph: 'at least 10 characters', show_pw: 'Show password', hide_pw: 'Hide password',
  btn_login: 'Log in', btn_register: 'Sign up',
  toggle_to_reg: 'No account yet? Sign up', toggle_to_login: 'Already have an account? Log in', forgot_link: 'Forgot password?',
  fine_email: 'Nobody else can see your email address.',
  forgot_title: 'Forgot your password?', forgot_sub: "Enter your email and we'll send you a reset link.", send_link: 'Send link', back_login: 'Back to login',
  reset_title: 'New password', reset_sub: 'Choose a new password with at least 10 characters.', new_pw: 'New password', save_pw: 'Save password',
  done_title: 'Check your inbox', done_sub: "We've sent you an email. One click on the link inside and you're in. Nothing there? Check your spam folder too.", to_login: 'To login',
  tab_today: 'Today', tab_board: 'Leaderboard', tab_suggest: 'Suggest', tab_account: 'Account', tabs_aria: 'Sections',
  what_drink: 'What are you drinking?', pick_aria: 'Choose a drink', pick_hint: 'Pick a drink.', add: 'Log it',
  today_h: 'Drunk today', count_one: 'drink', count_many: 'drinks', progress_aria: 'Caffeine today',
  left_pre: '', left_post: ' mg left until the daily limit', over_pre: 'You are ', over_post: ' mg over the daily limit',
  status0: 'Nothing yet. The cup is empty.', s25: 'Easy start. Plenty of room left.', s50: "Going well. You're in the safe zone.",
  s75: 'Past halfway. Take it slow.', s100: 'Almost at the limit. Maybe a glass of water now?', sover: "Limit exceeded. That's enough for today.",
  empty_title: 'Nothing logged yet', empty_text: 'Pick a drink above and the cup starts filling.',
  remove: 'remove', removed: 'Entry removed.', added: '{name} logged.', no_drinks: 'No drinks available right now.',
  size_h: 'How much are you drinking?', size_custom: 'Custom amount', size_custom_ph: '275', size_std: 'Standard',
  amount_invalid: 'Please enter an amount from 1 to 2000.',
  sum_detail: '{amount} {unit} · approx. {mg} mg caffeine',
  offline: 'No internet connection. Logging works again once you are online.', online: 'Back online.',
  board_h: 'Leaderboard', board_sub: 'Who is the most awake?', seg_aria: 'Period', p_day: 'Today', p_week: 'Week', p_month: 'Month',
  board_empty_t: 'Nobody in the race yet', board_empty_x: 'Log the first drink and take the top spot.', board_err: 'Leaderboard unavailable', retry: 'Try again', you: 'You',
  sg_title: 'Missing your favourite drink?', sg_sub: "Send us a suggestion. We'll review it and add it.",
  sg_name: 'Drink name', sg_name_ph: 'e.g. Cold brew', sg_portion: 'Serving size', sg_portion_ph: 'e.g. 330 ml', sg_mg: 'Caffeine in mg', sg_mg_ph: 'e.g. 120',
  sg_mg_hint: "Often on the packaging or the manufacturer's website.", sg_send: 'Send suggestion', sg_ok: 'Thanks! Your suggestion arrived.',
  acc_title: 'Your account', acc_as: 'Signed in as ', del_title: 'Delete account',
  del_sub: 'Your account and all your entries will be deleted for good. This cannot be undone.', del_open: 'Delete account…',
  dlg_title: 'Really delete?', dlg_text: 'For safety we need your password once more.', cancel: 'Cancel', del_confirm: 'Delete forever', del_done: 'Your account was deleted. Take care!',
  ld_kicker: 'Pouring…', bye: 'See you! You are logged out.', pw_saved: 'New password saved.',
  e_login: 'Email or password is wrong. Typo?', e_confirm: 'Please confirm your email address first. The link is in our email.',
  e_signup: "That didn't work. Maybe the username is already taken.", e_session: 'This link is invalid or has expired. Please request a new one.',
  e_samepw: 'The new password must differ from the old one.', e_rate: 'Too many requests right now. Wait a moment and try again.',
  e_generic: "That didn't work. Please try again in a moment.", e_email_req: 'Please enter your email address.',
  e_username: 'The username needs 3 to 20 characters: letters, numbers or _.', e_pw_len: 'Your password needs at least 10 characters.', e_pw_req: 'Please enter your password.',
  forgot_ok: 'If an account exists for this address, the link is on its way.',
  chaos_btn: 'CHAOS', chaos_stop: 'STOP', chaos_aria: 'Chaos mode', chaos_locked: 'Chaos mode unlocks at {mg} mg caffeine. {left} mg to go!',
  chaos_unlocked: 'CHAOS MODE unlocked! Look top right.', chaos_lost: 'Chaos mode ended: you are back under half the limit.',
  warn_title: 'Warning: flashing lights', warn_text: "Chaos mode has flashing lights, fast colour changes and loud music. If you are photosensitive or have epilepsy, please don't turn it on.",
  warn_go: 'Bring the chaos!', music_mute: 'Music on/off', music_next: 'Next song', now_playing: 'Now playing: ', synth_name: 'Built-in chaos beat',
  chaos_reduced: 'Your device prefers reduced motion, so chaos mode runs without flashing.',
  ticker: 'CHAOS MODE /// MORE CAFFEINE /// MORE LIGHT /// MORE CHAOS /// '
}
};
const FACTS = {
de: [
  { i: 'clock', t: 'Spitze nach einer Stunde', x: 'Koffein erreicht nach 30 bis 60 Minuten seine höchste Konzentration im Blut.' },
  { i: 'pulse', t: 'Halbwertszeit: 5 Stunden', x: 'Nach etwa 5 Stunden ist noch die Hälfte deines Koffeins im Körper aktiv.' },
  { i: 'shield', t: '400 mg sind die Grenze', x: 'Bis 400 mg am Tag gelten für gesunde Erwachsene als unbedenklich (EFSA).' },
  { i: 'zap', t: 'Nicht alles auf einmal', x: 'Einzeldosen über 200 mg solltest du vermeiden. Verteile deinen Konsum lieber.' },
  { i: 'heart', t: 'In der Schwangerschaft', x: 'Schwangere sollten höchstens 200 mg Koffein pro Tag zu sich nehmen.' },
  { i: 'moon', t: 'Koffein klaut Tiefschlaf', x: 'Spät getrunken stört Koffein den Tiefschlaf, auch wenn du problemlos einschläfst.' },
  { i: 'alert', t: 'Zu viel macht zappelig', x: 'Herzklopfen, Unruhe, Zittern und Magenprobleme können Zeichen einer Überdosis sein.' },
  { i: 'bulb', t: 'Müdigkeit wird nur versteckt', x: 'Koffein blockiert Adenosin-Rezeptoren. Das Müdigkeitssignal wird verdeckt, nicht abgebaut.' },
  { i: 'flame', t: 'Der Körper gewöhnt sich', x: 'Wer regelmäßig trinkt, braucht mehr für denselben Effekt. Beim Absetzen drohen Kopfschmerzen.' },
  { i: 'zap', t: 'Energy Drinks: doppelt riskant', x: 'Oft mehr Koffein als eine Tasse Kaffee, dazu viel Zucker.' }
],
en: [
  { i: 'clock', t: 'Peak after an hour', x: 'Caffeine reaches its highest level in your blood after 30 to 60 minutes.' },
  { i: 'pulse', t: 'Half-life: 5 hours', x: 'After about 5 hours, half of your caffeine is still active in your body.' },
  { i: 'shield', t: '400 mg is the limit', x: 'Up to 400 mg a day is considered safe for healthy adults (EFSA).' },
  { i: 'zap', t: 'Not all at once', x: 'Avoid single doses above 200 mg. Spread your intake instead.' },
  { i: 'heart', t: 'During pregnancy', x: 'Pregnant women should have no more than 200 mg of caffeine per day.' },
  { i: 'moon', t: 'Caffeine steals deep sleep', x: 'Taken late, caffeine disturbs deep sleep even if you fall asleep easily.' },
  { i: 'alert', t: 'Too much makes you jittery', x: 'Palpitations, restlessness, shaking and stomach trouble can be signs of an overdose.' },
  { i: 'bulb', t: 'Tiredness is only hidden', x: 'Caffeine blocks adenosine receptors. The tired signal is masked, not removed.' },
  { i: 'flame', t: 'Your body gets used to it', x: 'Regular drinkers need more for the same effect. Quitting can cause headaches.' },
  { i: 'zap', t: 'Energy drinks: double trouble', x: 'Often more caffeine than a cup of coffee, plus lots of sugar.' }
]};
// Getränkenamen kommen aus der Datenbank (deutsch). Bekannte Namen werden im englischen Modus übersetzt.
const DRINK_EN = { 'filterkaffee': 'Filter coffee', 'latte macchiato': 'Latte macchiato', 'cold brew': 'Cold brew', 'schwarzer tee': 'Black tea', 'grüner tee': 'Green tea',
  'mate-tee': 'Mate tea', 'eistee': 'Iced tea', 'dunkle schokolade': 'Dark chocolate' };

let LANG = 'de';
try { const s = localStorage.getItem('kr-lang'); LANG = (s === 'de' || s === 'en') ? s : ((navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en'); } catch { /* ohne Speicher: Standard */ }
function t(k, vars) {
  let s = (I18N[LANG] && I18N[LANG][k]) ?? I18N.de[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace('{' + a + '}', b);
  return s;
}
const drinkName = (n) => (LANG === 'en' && DRINK_EN[n.toLowerCase()]) || n;
function applyStatic() {
  document.documentElement.lang = LANG; document.title = t('title');
  const m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', t('meta_desc'));
  document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((e) => e.setAttribute('placeholder', t(e.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach((e) => { const v = t(e.dataset.i18nAria); e.setAttribute('aria-label', v); if (e.dataset.tip !== undefined) e.title = v; });
  const lb = $('lang'); if (lb) { $('lang-t').textContent = LANG === 'de' ? 'EN' : 'DE'; lb.setAttribute('aria-label', t('lang_aria')); lb.title = t('lang_aria'); }
}
