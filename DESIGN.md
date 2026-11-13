# DESIGN.md – Koffein Rechner

## Charakter
Warm, wach, ein bisschen verspielt. Wie ein gutes Café: Schwarzer Kaffee mit Neon: Glow, harte Schlagschatten, bunte Bohnen. Der Held jeder Seite ist die **Tasse**, die sich mit dem Tageskoffein füllt.

## Regeln (aus den 20 Design-Tipps)
- **Kein Violett-Verlauf, kein Standard-Look.** Violett vermeiden. Verläufe nur als Licht-Glow im Hintergrund.
- **Palette „Espresso Aurora“**: Bühne ist schwarzer Kaffee `#0C0709` mit einem langsam treibenden Aurora-Hintergrund (Glut-Orange `#FF5A3C`, Pink `#FF2E7E`, Gold `#FFC53D`) und genau einem kühlen Kontrast: Türkis `#1FE5C8`. Die warmen Farben liegen nebeneinander, das Türkis setzt Akzente (harte Schlagschatten, Links, Erfolg). Rot `#FF3355` nur für Limit überschritten und Fehler. Die Seite ist bewusst dauerhaft dunkel.
- **Schrift**: Bricolage Grotesque (selbst gehostet), nicht Inter. Überschriften 800, Text 400/600.
- **Abstände** nur aus der Skala: 4 / 8 / 16 / 24 / 32 / 48 / 72 px.
- **Ein Eckenradius** für alles: 16 px (Kreise nur für Avatare).
- **Echte SVG-Icons** (Sprite in `index.html`), keine Emojis.
- **Wenige Karten**: Das Dashboard ist offen gesetzt, Karten nur für Formulare.
- **Tab-Titel und Favicon** gesetzt; eigene 404-Seite.
- **Texte**: Menschlich, direkt, Du-Ansprache. Fehlermeldungen sagen, was passiert ist und was zu tun ist.
- **Zustände**: Jede Liste hat Leer-, Lade- (Skeleton) und Fehlerzustand.
- **Animation hat Bedeutung**: Tasse füllt sich, Zahlen zählen hoch, Bohnen-Burst + „+mg" beim Eintragen, Einschenk-Ladescreen mit Fakten, gleitende Tabs, Podium wächst. `prefers-reduced-motion` schaltet alles ab.

## Tokens
Siehe `:root` in `public/style.css`. Erst Tokens, dann Komponenten – keine Hex-Werte in Komponenten (Ausnahme: dunkler Ladescreen).

## Sicherheit
Strikte CSP: kein Inline-Style, kein Inline-Script. Dynamische Werte nur über `element.style.setProperty` bzw. CSS-Variablen.

## Chaos Mode
- Freischaltung ab **200 mg** (Hälfte des Tageslimits). Fällt der Wert wieder darunter, endet der Modus.
- Theme-Wechsel über `html.chaos`: Farben laufen über die registrierte Variable `--h` (Farbrad), dazu Neon-Glow, Glitch-Text, tanzende Tasse, Blitze, Bohnenregen, Ticker, Scanlines und Musik.
- **Sicherheit:** Warn-Dialog vor dem ersten Start. Blinken bleibt unter 3 Hz und mit geringer Deckkraft. Bei „weniger Bewegung“ im Betriebssystem laufen nur die Farben, ohne Blinken und Bewegung.
- Musik: `public/music/playlist.json` (siehe `LIES-MICH.txt`). Ohne Songs spielt ein eingebauter Beat (Web Audio).

## Sprachen
`public/i18n.js` enthält alle Texte in Deutsch und Englisch. Neue Texte immer in beiden Sprachen eintragen. Auswahl wird im Browser gemerkt.

## Wasser-Effekt & UI+
- `public/water.js`: WebGL-Shader im Hintergrund (`#bg`), Wellen folgen dem Mauszeiger, Klick erzeugt eine große Welle. Liegt hinter der gesamten Oberfläche (`pointer-events:none`). Ausgeschaltet bei „weniger Bewegung“ und ohne WebGL.
- `public/ui.js`: Spotlight am Mauszeiger auf Karten/Kacheln und leichte 3D-Neigung der Getränke-Kacheln.
- Karten sind „Glas“: halbtransparent, Blur, Verlauf-Haarlinie als Rand (CSS-Maske), Glanz-Sweep auf Buttons.

## Mengenauswahl
Nach der Getränkewahl erscheinen 3 Größen (Standardportion, kleiner, größer) und ein freies Feld (1–2000). Bis 60 ml/g: Einzel, Doppel, Dreifach. Die mg werden proportional zur Standardportion berechnet. **Der Server rechnet nach** (`add_intake(p_drink_id, p_amount)` in `supabase/schema.sql`), der Browser schickt nur die Menge. Gespeichert wird die Menge in `intakes.amount`.

## Update: Rave, Sprüche, Wasser
- Chaos Mode = Rave: Beat-Blitze (--beat, 150 BPM, max. ~2,5 Blitze/s), Laser, Scheinwerfer, Discokugel, Equalizer, Konfetti, schnelle Farbwechsel. Esc beendet sofort.
- 31 Sprüche pro Sprache, Zufall ohne Wiederholung (Shuffle-Bag).
- Wasser: stärkere Wellen, Wellen auch ohne Maus, 2D-Fallback ohne WebGL. Bei "weniger Bewegung" im System: Schalter unter Konto > Animationen.
