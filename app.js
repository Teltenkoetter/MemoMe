/* MemoMe
   Keine Leistungs-App: sammeln statt fordern, zeigen was da war, nie was fehlt. */
'use strict';

// ── Grunddaten ─────────────────────────────────────────
// Gruppen liegen in S (selbst anlegbar, sortierbar). GRUPPEN ist daraus gebaut: id → Name, in der eingestellten Reihenfolge.
const START_GRUPPEN = [ { id: 'family', name: 'Family' }, { id: 'social', name: 'Social' }, { id: 'metime', name: 'Me-Time' } ];
let GRUPPEN = {};
function gruppenAktualisieren() {
  GRUPPEN = {}; for (const g of S.gruppen) GRUPPEN[g.id] = g.name;
}
const MODI = { akt: 'Aktivierung', reg: 'Regeneration', beides: 'aktiv für mich' };
// Rahmen des Tages: drei gefühlte Werte, oben der eine Pol, unten der andere. Keine Wertung, keine Ampel.
const WAHL = {
  schlaf:  { name: 'Schlaf',  icon: 'schlaf',  werte: [['erholt', 'erholt'], ['mittel', 'mittel'], ['kurz', 'kurz']] },
  essen:   { name: 'Essen',   icon: 'essen',   werte: [['frisch', 'frisch'], ['gemischt', 'gemischt'], ['gegoennt', 'gegönnt']] },
  trinken: { name: 'Trinken', icon: 'trinken', werte: [['viel', 'viel'], ['mittel', 'mittel'], ['wenig', 'wenig']] },
};
const WAHL_TEXT = (art, w) => (WAHL[art].werte.find(x => x[0] === w) || [w, w])[1];
const wahlAn = art => S.einstellungen['zeige_' + art] !== false;

// Piktogramme: 24er-Raster, Linie 1.75, runde Enden, currentColor (wie im MemoMe Design System)
const PIKTO = {"kaffee": "<path d=\"M4 9h12v4.5A5.5 5.5 0 0 1 10.5 19h-1A5.5 5.5 0 0 1 4 13.5Z\"/><path d=\"M16 10.5h1.5a2.75 2.75 0 0 1 0 5.5H16\"/><path d=\"M8 3.5v2.5M12 3.5v2.5\"/><path d=\"M3 21.5h14\"/>", "cello": "<path d=\"M12 7.4C9.8 7.4 8.4 8.5 8.4 10.3c0 1.2 1 1.8 1 2.8s-2 1.7-2 3.9c0 2.4 2 3.7 4.6 3.7s4.6-1.3 4.6-3.7c0-2.2-2-2.9-2-3.9s1-1.6 1-2.8c0-1.8-1.4-2.9-3.6-2.9Z\"/><path d=\"M12 16.2V1.8M10.9 3.4h2.2M10.4 16.2h3.2M12 20.7v2.3\"/>", "sport": "<circle cx=\"15.5\" cy=\"4.2\" r=\"1.9\"/><path d=\"M13.6 8 10.6 13.6\"/><path d=\"M13.6 8l2.8 2.6 2.4-1.4\"/><path d=\"M13.6 8 10.2 8.6 8 10.8\"/><path d=\"M10.6 13.6l3.4 2.8-1 4.8\"/><path d=\"M10.6 13.6 8.4 17.2 4.6 17.6\"/>", "meditation": "<circle cx=\"12\" cy=\"4.6\" r=\"2\"/><path d=\"M12 8.4v6.2\"/><path d=\"M12 9.6l-4.4 4.6 3 2.2M12 9.6l4.4 4.6-3 2.2\"/><path d=\"M4 19.5c2.4-2.6 5.2-3.2 8-3.2s5.6.6 8 3.2Z\"/>", "spaziergang": "<circle cx=\"12.6\" cy=\"4.2\" r=\"1.9\"/><path d=\"M12.2 8l-.8 6.2\"/><path d=\"M11.4 14.2l2.4 3.2.6 3.6M11.4 14.2l-1.8 3.4-1.4 3.4\"/><path d=\"M12.2 8.6l2.6 3.2M12.2 8.6 9.6 11.6\"/><path d=\"M17.4 11v10\"/>", "lesen": "<path d=\"M3 5.6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1Z\"/><path d=\"M12 6.6v13\"/>", "offline": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.6\"/><path d=\"M10.6 5h2.8\"/><path d=\"M4 4l16 16\"/>", "familie": "<circle cx=\"7\" cy=\"6\" r=\"2.2\"/><circle cx=\"17\" cy=\"6\" r=\"2.2\"/><circle cx=\"12\" cy=\"12.6\" r=\"1.4\"/><path d=\"M3.5 20.5v-6a3.5 3.5 0 0 1 7 0v6M13.5 20.5v-6a3.5 3.5 0 0 1 7 0v6M10.6 20.5v-3a1.4 1.4 0 0 1 2.8 0v3\"/>", "zuzweit": "<circle cx=\"9\" cy=\"12\" r=\"5.6\"/><circle cx=\"15\" cy=\"12\" r=\"5.6\"/>", "freunde": "<g transform=\"rotate(-12 7.5 13)\"><path d=\"M4.6 8h5.8l-.9 10a1.4 1.4 0 0 1-1.4 1.3H6.9a1.4 1.4 0 0 1-1.4-1.3Z\"/></g><g transform=\"rotate(12 16.5 13)\"><path d=\"M13.6 8h5.8l-.9 10a1.4 1.4 0 0 1-1.4 1.3h-1.2a1.4 1.4 0 0 1-1.4-1.3Z\"/></g><path d=\"M12 2.5v2.2M9.4 3.3l.9 1.6M14.6 3.3l-.9 1.6\"/>", "coding": "<path d=\"M8 7l-5 5 5 5M16 7l5 5-5 5M13.6 5l-3.2 14\"/>", "brot": "<path d=\"M3 14c0-4 4-6.5 9-6.5s9 2.5 9 6.5c0 2-1.5 3.5-3.5 3.5h-11C4.5 17.5 3 16 3 14Z\"/><path d=\"M8 9.4l1.4 3.2M12 8.8v3.6M16 9.4l-1.4 3.2\"/><path d=\"M5 20.5h14\"/>", "feierabend": "<path d=\"M5.5 21.5V3\"/><path d=\"M5.5 3.8h12.5l-2.6 4.2 2.6 4.2H5.5\"/>", "schlaf": "<path d=\"M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1Z\"/>", "kultur": "<path d=\"M4 9.5 12 4l8 5.5\"/><path d=\"M5 20.5h14M6.5 10.5v8M10 10.5v8M14 10.5v8M17.5 10.5v8\"/>", "gruene": "<path d=\"M6 19c0-8 5-13 13-13 0 8-5 13-13 13Z\"/><path d=\"M4 21l9-9\"/>", "kinder": "<circle cx=\"8\" cy=\"4.6\" r=\"1.9\"/><path d=\"M8 8.2v7.3M8 15.5l-2.2 5.5M8 15.5l2.2 5.5M8 10.2l4.6 2.8\"/><circle cx=\"16.5\" cy=\"10.8\" r=\"1.5\"/><path d=\"M16.5 13.6v4.2M16.5 17.8l-1.6 3.2M16.5 17.8l1.6 3.2M16.5 14.6l-3.9-1.6\"/>", "orga": "<rect x=\"5\" y=\"4.5\" width=\"14\" height=\"16.5\" rx=\"2.5\"/><rect x=\"8.5\" y=\"2.6\" width=\"7\" height=\"3.8\" rx=\"1.3\"/><path d=\"M8.6 11.2h.4M11.8 11.2h3.8M8.6 14.6h.4M11.8 14.6h3.8M8.6 18h.4M11.8 18h3.8\"/>", "haus": "<path d=\"M12 2.5v9\"/><path d=\"M7.5 11.5h9l1.6 9H5.9Z\"/><path d=\"M9.6 15v5.5M12 15v5.5M14.4 15v5.5\"/>", "kraft": "<path d=\"M7 12h10\"/><rect x=\"3.5\" y=\"7.5\" width=\"3.5\" height=\"9\" rx=\"1.2\"/><rect x=\"17\" y=\"7.5\" width=\"3.5\" height=\"9\" rx=\"1.2\"/><path d=\"M2 10.5v3M22 10.5v3\"/>", "musik": "<path d=\"M4 15v-3a8 8 0 0 1 16 0v3\"/><rect x=\"3\" y=\"14\" width=\"4.2\" height=\"6.5\" rx=\"1.8\"/><rect x=\"16.8\" y=\"14\" width=\"4.2\" height=\"6.5\" rx=\"1.8\"/>", "wlanaus": "<path d=\"M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0\"/><circle cx=\"12\" cy=\"19.4\" r=\".9\"/><path d=\"M4 4l16 16\"/>", "buehne": "<path d=\"M5 3.5h14v7.5a7 7 0 0 1-14 0Z\"/><path d=\"M8.3 9.2c.6-.8 1.6-.8 2.2 0M13.5 9.2c.6-.8 1.6-.8 2.2 0\"/><path d=\"M8.8 13.6a3.6 3.6 0 0 0 6.4 0\"/>", "tee": "<path d=\"M4 10.5h16c0 4.7-3.6 8.5-8 8.5s-8-3.8-8-8.5Z\"/><path d=\"M9 19l-.6 2h7.2l-.6-2\"/><path d=\"M9.5 3.5c-1 1.2 1 2 0 3.3M14.5 3.5c-1 1.2 1 2 0 3.3\"/>", "essen": "<circle cx=\"14\" cy=\"12.5\" r=\"6.8\"/><circle cx=\"14\" cy=\"12.5\" r=\"3.6\"/><path d=\"M2.8 3.5v4.2a1.7 1.7 0 0 0 3.4 0V3.5M4.5 3.5v17\"/>", "trinken": "<path d=\"M5.5 3.5h13l-1.7 16.3a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z\"/><path d=\"M6.4 11.2c1.9-.9 3.7-.9 5.6 0s3.7.9 5.6 0\"/>", "gespraech": "<path d=\"M4.5 4h9a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H8.5L5.5 15v-2.5h-1a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z\"/><path d=\"M18 9h1.5a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-1V20l-3-2.5h-4a2 2 0 0 1-2-1.6\"/>"};
function pikto(name, cls = 'pikto', strich = 1.75) {
  const p = PIKTO[name]; if (!p) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strich}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
// Herz für „Angebot für andere“: Umriss grau = offen, gefüllt = angekommen
const HERZ = '<svg class="herz" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.6-4.7-7.6-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10.2-7.6 10.2Z"/></svg>';
const herzHTML = (voll, extra = '') => `<span class="herz-wrap${voll ? ' voll' : ''}${extra}">${HERZ}</span>`;
const wochenKey = d => `${d.getFullYear()}-W${kw(d)}`;

// Piktogramm, sonst eigenes Zeichen
// Piktogramm; ältere Momente können noch ein eigenes Zeichen haben; „kein Piktogramm“ zeigt nichts
const hatSymbol = m => !!((m.icon && PIKTO[m.icon]) || (m.icon !== 'kein' && m.symbol));
const symbolHTML = (m, strich) => (m.icon && PIKTO[m.icon]) ? pikto(m.icon, 'pikto', strich) : (m.icon !== 'kein' && m.symbol) ? `<span class="zeichen">${esc(m.symbol)}</span>` : '';

const START_MOMENTE = [
  { id: 'kaffee',      name: 'Kaffeepause',          symbol: '☕', icon: 'kaffee', gruppe: 'social', modus: 'reg',    dauer: 15 },
  { id: 'cello',       name: 'Cello',                symbol: '🎻', icon: 'cello', gruppe: 'metime', modus: 'reg',    dauer: 30 },
  { id: 'sport',       name: 'Sport / Joggen',       symbol: '🏃', icon: 'sport', gruppe: 'metime', modus: 'beides', dauer: 30 },
  { id: 'meditation',  name: 'Meditation',           symbol: '🧘', icon: 'meditation', gruppe: 'metime', modus: 'reg',    dauer: 10 },
  { id: 'spaziergang', name: 'Spaziergang',          symbol: '🚶', icon: 'spaziergang', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'lesen',       name: 'Lesen',                symbol: '📖', icon: 'lesen', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'offline',     name: 'Offline',              symbol: '📵', icon: 'offline', gruppe: 'metime', modus: 'reg',    dauer: 60 },
  { id: 'familie',     name: 'Familienzeit',         symbol: '👨‍👩‍👧', icon: 'familie', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'zuzweit',     name: 'Zeit zu zweit',        symbol: '💑', icon: 'zuzweit', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'freunde',     name: 'Freunde treffen',      symbol: '🍻', icon: 'freunde', gruppe: 'social', modus: 'beides', dauer: 60 },
  { id: 'vibe',        name: 'Vibe Coding',          symbol: '💻', icon: 'coding', gruppe: 'metime', modus: 'beides', dauer: 30, genugTag: 120 },
];

function startZustand() {
  return {
    version: 1,
    stand: 5,            // Datenstand: 5 = Gruppen und Momente in einer Liste, keine Untergruppen
    gruppen: START_GRUPPEN.map(g => ({ ...g })),
    momente: START_MOMENTE.map(m => ({ ...m })),
    taps: [],            // { id, mid, ts, min }
    feierabend: {},      // 'JJJJ-MM-TT' → 'HH:MM'
    schlaf: {},          // 'JJJJ-MM-TT' → 'erholt' | 'mittel' | 'kurz'
    essen: {},           // 'JJJJ-MM-TT' → 'frisch' | 'gemischt' | 'gegoennt'
    trinken: {},         // 'JJJJ-MM-TT' → 'viel' | 'mittel' | 'wenig'
    wochen: {},          // 'JJJJ-Wkw' → { angebote: { mid: { an, mir } }, satz, abgeschlossen }
    einstellungen: { korridorVon: '17:30', korridorBis: '19:00', balanceStil: 'band', modus: 'einfach', zeige_schlaf: true, zeige_essen: true, zeige_trinken: true },
  };
}

// ── Speicher (IndexedDB, Notfall: localStorage) ────────
const DB_NAME = 'memome', STORE = 'kv', KEY = 'zustand';
let dbP = null;
function db() {
  if (!dbP) dbP = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbP;
}
async function laden() {
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const t = d.transaction(STORE).objectStore(STORE).get(KEY);
      t.onsuccess = () => res(t.result || null);
      t.onerror = () => rej(t.error);
    });
  } catch {
    try { return JSON.parse(localStorage.getItem('memome-' + KEY)); } catch { return null; }
  }
}
let speicherTimer = null;
function speichern() {
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(async () => {
    try {
      const d = await db();
      d.transaction(STORE, 'readwrite').objectStore(STORE).put(S, KEY);
    } catch {
      try { localStorage.setItem('memome-' + KEY, JSON.stringify(S)); } catch {}
    }
  }, 150);
}

let S = startZustand();

// ── Hilfen ─────────────────────────────────────────────
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const tagKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const heuteKey = () => tagKey(new Date());
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const moment = id => S.momente.find(m => m.id === id);
const zuMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const zuHHMM = min => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.round(min % 60))}`;

function fmtDauer(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  if (r === 0) return `${h} h`;
  if (r === 30) return `${h}½ h`;
  return `${h} h ${r}`;
}

function wocheStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function kw(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - j) / 86400000 + 1) / 7);
}

function tapsZwischen(von, bis) {
  const a = von.getTime(), b = bis.getTime();
  return S.taps.filter(t => t.ts >= a && t.ts < b && moment(t.mid));
}
function tapsHeute() {
  const d = new Date(); const von = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const bis = new Date(von); bis.setDate(bis.getDate() + 1);
  return tapsZwischen(von, bis);
}

function balance(taps) {
  let akt = 0, reg = 0;
  for (const t of taps) {
    const m = moment(t.mid); if (!m) continue;
    const w = t.min || 10; // Momente ohne Dauer zählen leicht mit
    if (m.modus === 'akt') akt += w;
    else if (m.modus === 'reg') reg += w;
    else { akt += w / 2; reg += w / 2; }
  }
  const sum = akt + reg;
  let wort = 'Noch offen';
  if (sum > 0) {
    const r = reg / sum;
    wort = r > 0.62 ? 'eher regenerativ' : r < 0.38 ? 'eher aktiv' : 'ausgeglichen';
  }
  return { akt, reg, sum, wort };
}

// ── Balance-Darstellung ────────────────────────────────
function balanceHTML(b, stil, titel) {
  const kopf = `<div class="balance-kopf"><span class="label">${esc(titel)}</span>
    <span class="balance-wort${b.sum ? '' : ' leer'}">${esc(b.wort)}</span></div>`;
  if (stil === 'waage') return kopf + waageSVG(b);
  const a = b.sum ? b.akt : 1, r = b.sum ? b.reg : 1;
  const leer = b.sum ? '' : ' style="opacity:.35"';
  return kopf + `<div class="band" role="img" aria-label="Balance: ${esc(b.wort)}"${leer}>
      <div class="band-akt" style="flex-grow:${a}"></div><div class="band-reg" style="flex-grow:${r}"></div>
      <div class="band-mitte"></div></div>
    <div class="band-legende"><span class="akt">Aktivität</span><span class="reg">Regeneration</span></div>`;
}

function waageSVG(b) {
  const neig = b.sum ? (b.akt - b.reg) / b.sum : 0;     // >0: Aktivität schwerer
  const a = -neig * 13 * Math.PI / 180;                  // links runter = gegen den Uhrzeigersinn
  const cx = 160, cy = 34, L = 112;
  const lx = cx - L * Math.cos(a), ly = cy - L * Math.sin(a);
  const rx = cx + L * Math.cos(a), ry = cy + L * Math.sin(a);
  const schale = (x, y, rgb, fuell) => `
    <line x1="${x}" y1="${y}" x2="${x - 22}" y2="${y + 34}" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
    <line x1="${x}" y1="${y}" x2="${x + 22}" y2="${y + 34}" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
    <path d="M${x - 30} ${y + 34} Q ${x} ${y + 56} ${x + 30} ${y + 34} Z" fill="rgba(${rgb},${fuell})" stroke="rgba(${rgb},.9)" stroke-width="1.2"/>`;
  const fa = b.sum ? 0.15 + 0.6 * (b.akt / b.sum) : 0.08, fr = b.sum ? 0.15 + 0.6 * (b.reg / b.sum) : 0.08;
  return `<svg class="waage" viewBox="0 0 320 128" role="img" aria-label="Waage: ${esc(b.wort)}">
    <path d="M${cx} ${cy} L ${cx - 16} 112 L ${cx + 16} 112 Z" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.18)"/>
    <line x1="${cx - 40}" y1="114" x2="${cx + 40}" y2="114" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>
    <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="#fafafa"/>
    ${schale(lx, ly, '217,163,106', fa)}
    ${schale(rx, ry, '134,189,181', fr)}
    <text x="${lx}" y="${ly + 66}" text-anchor="middle" fill="rgba(217,163,106,.9)" font-size="11" font-family="Inter, sans-serif">Aktivität</text>
    <text x="${rx}" y="${ry + 66}" text-anchor="middle" fill="rgba(134,189,181,.9)" font-size="11" font-family="Inter, sans-serif">Regeneration</text>
  </svg>`;
}

// ── HEUTE ──────────────────────────────────────────────
function renderHeute() {
  const jetzt = new Date();
  $('#heute-datum').textContent = jetzt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  const taps = tapsHeute();
  $('#balance-heute').innerHTML = balanceHTML(balance(taps), S.einstellungen.balanceStil, 'Balance heute');

  // Sonderkacheln
  const k = heuteKey();
  const fa = S.feierabend[k];
  const spalte = art => {
    const w = (S[art] ||= {})[k];
    return `<div class="kachel rahmen spalte abend${w ? ' gefuellt' : ''}" data-sonder="${art}">
      <span class="kachel-symbol" aria-hidden="true">${pikto(WAHL[art].icon, 'pikto', 1.4)}</span>
      <span class="kachel-name">${WAHL[art].name}</span>
      <div class="wahl" role="group" aria-label="${WAHL[art].name}, gefühlt">
        ${WAHL[art].werte.map(([v, t]) => `<button type="button" data-wahl="${art}" data-wert="${v}" class="${w === v ? 'an' : ''}" aria-pressed="${w === v}">${t}</button>`).join('')}
      </div></div>`;
  };
  const arten = Object.keys(WAHL).filter(wahlAn);
  const sonder = $('#sonder-kacheln');
  sonder.style.setProperty('--spalten', arten.length + 1);
  sonder.innerHTML = arten.map(spalte).join('') + `
    <button class="kachel rahmen spalte abend${fa ? ' gefuellt' : ''}" data-sonder="feierabend" type="button" aria-label="Feierabend${fa ? ' ' + fa : ''}">
      <span class="kachel-symbol" aria-hidden="true">${pikto('feierabend', 'pikto', 1.4)}</span>
      <span class="kachel-name">Feierabend</span>
      <span class="kachel-wert">${fa ? `<span class="kachel-zahl">${fa}</span>` : '<span class="spalte-leise">tippen</span>'}</span>
      ${ringSVG()}
    </button>`;

  // Momente
  const proMoment = {};
  for (const t of taps) { const p = proMoment[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min || 0; }
  const kachel = m => {
    const p = proMoment[m.id];
    let wert = '', zusatz = '';
    if (p) {
      wert = m.dauer > 0
        ? `<span class="kachel-zahl">${fmtDauer(p.min)}</span><span class="kachel-dauer">${p.n}×</span>`
        : `<span class="kachel-zahl">${p.n}×</span>`;
      if (m.genugTag && p.min >= m.genugTag) zusatz = '<span class="kachel-genug">genug für heute</span>';
    }
    return `<button class="kachel ${m.modus}${p ? ' gefuellt' : ''}${hatSymbol(m) ? '' : ' ohne-pikto'}" data-mid="${esc(m.id)}" type="button" aria-label="${esc(m.name)}${p ? ', heute ' + p.n + ' mal' : ''}">
      <span class="kachel-symbol" aria-hidden="true">${symbolHTML(m, 1.4)}</span>
      <span class="kachel-wert">${wert}</span>
      <span><span class="kachel-name">${esc(m.name)}${m.angebot ? herzHTML(false, ' kachel-herz') : ''}</span>${zusatz ? '<br>' + zusatz : ''}</span>
      ${ringSVG()}
    </button>`;
  };
  $('#moment-kacheln').innerHTML = [...Object.keys(GRUPPEN), ''].map(g => {
    const liste = S.momente.filter(m => g ? m.gruppe === g : !GRUPPEN[m.gruppe]);
    if (!liste.length) return '';
    const titel = g ? GRUPPEN[g] : 'Ohne Gruppe';
    return `<section class="gruppe-block" aria-label="${esc(titel)}">
      <div class="label gruppe-label">${esc(titel)}</div>
      <div class="kachel-raster">${liste.map(kachel).join('')}</div></section>`;
  }).join('');
}
const ringSVG = () => `<svg class="kachel-ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="spur" cx="32" cy="32" r="28"/><circle class="fuell" cx="32" cy="32" r="28"/></svg>`;

function puls(el) { el.classList.remove('puls'); void el.offsetWidth; el.classList.add('puls'); }

function zaehlen(mid) {
  const m = moment(mid); if (!m) return;
  S.taps.push({ id: uid(), mid, ts: Date.now(), min: m.dauer || 0 });
  speichern(); renderHeute();
  const el = document.querySelector(`.kachel[data-mid="${CSS.escape(mid)}"]`);
  if (el) puls(el);
  if (navigator.vibrate) navigator.vibrate(8);
}

function zuruecknehmen(mid) {
  const heute = new Set(tapsHeute().filter(t => t.mid === mid).map(t => t.id));
  if (!heute.size) return false;
  let idx = -1;
  for (let i = S.taps.length - 1; i >= 0; i--) if (heute.has(S.taps[i].id)) { idx = i; break; }
  const [weg] = S.taps.splice(idx, 1);
  speichern(); renderHeute();
  const m = moment(mid);
  toast(`${m.name}: zurückgenommen`, () => { S.taps.splice(idx, 0, weg); speichern(); renderHeute(); toast('Wiederhergestellt'); });
  return true;
}

function feierabendJetzt() {
  const d = new Date(), k = tagKey(d), z = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  S.feierabend[k] = z; speichern(); renderHeute();
  puls(document.querySelector('[data-sonder="feierabend"]'));
  toast(`Feierabend um ${z}`, () => { delete S.feierabend[k]; speichern(); renderHeute(); });
}

function feierabendSheet() {
  const tage = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    tage.push([tagKey(d), i === 0 ? 'heute' : i === 1 ? 'gestern' : d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' })]);
  }
  const k0 = heuteKey();
  const jetzt = new Date();
  const zeit = S.feierabend[k0] || `${pad(jetzt.getHours())}:${pad(jetzt.getMinutes())}`;
  sheet('Feierabend', `
    <p class="card-text">Vergessen ist in Ordnung. Hier lässt sich die Uhrzeit anpassen oder nachtragen.</p>
    <div class="form-reihe">
      <div class="form-group"><label for="fa-tag">Tag</label>
        <select id="fa-tag">${tage.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
      <div class="form-group"><label for="fa-zeit">Uhrzeit</label><input type="time" id="fa-zeit" value="${zeit}"></div>
    </div>
    <div class="btn-reihe">
      <button class="btn-primary" id="fa-ok" type="button">Übernehmen</button>
      <button class="btn-leise" id="fa-weg" type="button">Eintrag für diesen Tag entfernen</button>
    </div>`);
  const tagSel = $('#fa-tag'), zeitIn = $('#fa-zeit');
  const sync = () => { $('#fa-weg').classList.toggle('hidden', !S.feierabend[tagSel.value]); if (S.feierabend[tagSel.value]) zeitIn.value = S.feierabend[tagSel.value]; };
  tagSel.onchange = sync; sync();
  $('#fa-ok').onclick = () => { if (!zeitIn.value) return; S.feierabend[tagSel.value] = zeitIn.value; speichern(); sheetZu(); renderAlles(); toast(`Feierabend ${zeitIn.value} gespeichert`); };
  $('#fa-weg').onclick = () => { delete S.feierabend[tagSel.value]; speichern(); sheetZu(); renderAlles(); toast('Eintrag entfernt'); };
}

// Tippen und langer Druck
const DRUCK_MS = 600;   // langer Druck zum Zurücknehmen (vorher 1 s, war zu lang)
let druck = null;
function druckStart(e) {
  const el = e.target.closest('.kachel[data-mid], .kachel[data-sonder="feierabend"]');
  if (!el || (e.button !== undefined && e.button !== 0)) return;
  const mid = el.dataset.mid;
  const kannZurueck = mid ? tapsHeute().some(t => t.mid === mid) : true;
  druck = { el, mid, x: e.clientX, y: e.clientY, lang: false };
  if (kannZurueck) {
    el.classList.add('drueckt');
    druck.timer = setTimeout(() => {
      druck.lang = true; el.classList.remove('drueckt');
      if (navigator.vibrate) navigator.vibrate(15);
      if (mid) zuruecknehmen(mid); else feierabendSheet();
    }, DRUCK_MS);
  }
}
function druckAbbruch() { if (!druck) return; clearTimeout(druck.timer); druck.el.classList.remove('drueckt'); druck = null; }
function druckEnde(e) {
  if (!druck) return;
  const d = druck; clearTimeout(d.timer); d.el.classList.remove('drueckt'); druck = null;
  if (d.lang) return;
  if (d.mid) zaehlen(d.mid);
  else if (S.feierabend[heuteKey()]) feierabendSheet();
  else feierabendJetzt();
}
function druckBewegt(e) { if (druck && Math.hypot(e.clientX - druck.x, e.clientY - druck.y) > 12) druckAbbruch(); }

// ── WOCHE ──────────────────────────────────────────────
let wocheVersatz = 0;
function renderWoche() {
  const start = wocheStart(new Date()); start.setDate(start.getDate() + wocheVersatz * 7);
  const ende = new Date(start); ende.setDate(ende.getDate() + 7);
  const letzter = new Date(ende); letzter.setDate(letzter.getDate() - 1);
  $('#woche-kw').textContent = `KW ${kw(start)}`;
  const f = { day: 'numeric', month: 'long' };
  const anf = start.getMonth() === letzter.getMonth() ? `${start.getDate()}.` : start.toLocaleDateString('de-DE', f);
  $('#woche-spanne').textContent = `${anf} – ${letzter.toLocaleDateString('de-DE', f)}${wocheVersatz === 0 ? ' · diese Woche' : ''}`;
  $('#woche-vor').disabled = wocheVersatz >= 0;

  const taps = tapsZwischen(start, ende);
  const b = balance(taps);
  const wk = wochenKey(start);
  const notiz = (S.wochen ||= {})[wk] || {};
  const tage = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); tage.push(d); }
  const abende = tage.map(d => ({ d, z: S.feierabend[tagKey(d)] })).filter(x => x.z);
  const gefuehlt = Object.keys(WAHL).some(art => tage.some(d => (S[art] || {})[tagKey(d)]));

  const teile = [];
  const gesamtMin = taps.reduce((s, t) => s + (t.min || 0), 0);
  teile.push(`<div class="card">${balanceHTML(b, S.einstellungen.balanceStil, 'Balance der Woche')}
    ${taps.length ? `<p class="card-text" style="margin:0.75rem 0 0">${taps.length} Momente${gesamtMin ? ` · ${fmtDauer(gesamtMin)} gesammelt` : ''}</p>` : ''}</div>`);

  if (!taps.length && !abende.length && !gefuehlt) {
    teile.push(`<div class="card"><p class="leer-text">In dieser Woche ist noch nichts gesammelt. Das ist in Ordnung.</p></div>`);
  }

  if (taps.length) {
    const pm = {};
    for (const t of taps) { const p = pm[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min || 0; }
    // gleiche Ordnung wie auf Heute: Gruppen in ihrer Reihenfolge, darin die Momente in ihrer Reihenfolge
    const zeile = m => {
      const p = pm[m.id];
      const rgb = m.modus === 'akt' ? 'var(--akt-rgb)' : 'var(--reg-rgb)';
      let band = '';
      if (m.etwa) {
        const zEnde = m.genugWoche && m.genugWoche > m.etwa ? m.genugWoche : m.etwa;
        const max = Math.max(p.n, zEnde) + 1.5;
        const pos = v => Math.min(100, (v / max) * 100);
        const zAnf = Math.max(0, m.etwa - 0.5);
        band = `<div class="richtband" style="--m-rgb:${rgb}" aria-hidden="true">
            <div class="richtband-zone" style="left:${pos(zAnf)}%;width:${pos(zEnde + 0.5) - pos(zAnf)}%"></div>
            <div class="richtband-punkt" style="left:${pos(p.n)}%"></div></div>
          <div class="richtband-text">Richtwert etwa ${m.etwa} × pro Woche</div>`;
      }
      return `<div class="summe">
        <span class="summe-symbol" aria-hidden="true">${symbolHTML(m)}</span>
        <span class="summe-name">${esc(m.name)}${m.angebot ? herzHTML(['angekommen', 'getragen'].includes(notiz.angebote?.[m.id]?.an), ' summe-herz') : ''}</span>
        <span class="summe-wert"><strong>${p.n} ×</strong>${p.min ? ' · ' + fmtDauer(p.min) : ''}</span>
        ${band}</div>`;
    };
    // je Gruppe: aktiver und regenerativer Anteil (beides halb/halb)
    const pg = {};
    for (const t of taps) {
      const m = moment(t.mid), w = t.min || 10, g = GRUPPEN[m.gruppe] ? m.gruppe : '';
      const e = pg[g] ||= { akt: 0, reg: 0, min: 0 };
      if (m.modus === 'akt') e.akt += w; else if (m.modus === 'reg') e.reg += w; else { e.akt += w / 2; e.reg += w / 2; }
      e.min += t.min || 0;
    }
    const maxG = Math.max(...Object.values(pg).map(e => e.akt + e.reg));
    // Gruppen in der eingestellten Reihenfolge, geschlossen; darin die Momente in ihrer Reihenfolge
    const gz = [...Object.keys(GRUPPEN), ''].filter(g => pg[g]).map(g => {
      const e = pg[g], breite = Math.max(6, (e.akt + e.reg) / maxG * 100);
      const liste = S.momente.filter(m => pm[m.id] && (g ? m.gruppe === g : !GRUPPEN[m.gruppe]));
      return `<details class="wgruppe"><summary class="gruppe-zeile">
        <span class="gruppe-name">${esc(g ? GRUPPEN[g] : 'Ohne Gruppe')}<span class="gruppe-anzahl">${liste.length === 1 ? '1 Moment' : liste.length + ' Momente'}</span></span>
        <span class="gruppe-spur"><span class="gruppe-fuell" style="width:${breite}%" role="img" aria-label="${e.akt > e.reg ? 'eher aktiv' : e.reg > e.akt ? 'eher regenerativ' : 'ausgeglichen'}">
          <span class="teil-akt" style="flex-grow:${e.akt}"></span><span class="teil-reg" style="flex-grow:${e.reg}"></span></span></span>
        <span class="gruppe-wert">${e.min ? fmtDauer(e.min) : ''}</span><span class="auf" aria-hidden="true">›</span></summary>
        <div class="wgruppe-momente">${liste.map(zeile).join('')}</div></details>`;
    }).join('');
    teile.push(`<div class="card"><div class="card-header"><h2>Momente</h2><button class="btn-klein rechts btn-alle" type="button" aria-expanded="false" aria-label="Alle Zeilen öffnen"><span class="dreieck" aria-hidden="true">▸</span> Alle</button></div><div class="gruppen">${gz}</div>
      <div class="band-legende"><span class="akt">aktiv</span><span class="reg">regenerativ</span></div></div>`);
  }

  // Über den Tag: wann die Momente lagen (Leuchtpunkte, Größe = Dauer, Strich = Feierabend)
  if (taps.length) teile.push(`<div class="card"><div class="card-header"><h2>Über den Tag</h2></div>
      <div class="tag-filter" role="group" aria-label="Momente zeigen">
        ${[['erholsam', 'erholsam', 'reg'], ['fuermich', 'für mich', 'mich'], ['aktiv', 'aktiv', 'akt']].map(([k, t, c]) => `<button type="button" class="btn-klein filter-${c}${heatFilter[k] ? ' an' : ''}" data-filter="${k}" aria-pressed="${heatFilter[k]}">${t}</button>`).join('')}</div>
      <div id="tag-karte">${tagKarte(taps, tage)}</div>
      <p class="tag-legende">Länge = Dauer · Strich = Feierabend</p></div>`);

  // Rahmen des Tages: je eine schmale Grafik direkt in der Zeile, ohne Aufklappen
  const rahmen = [];
  for (const art of Object.keys(WAHL)) {
    const werte = tage.map(d => (S[art] || {})[tagKey(d)]).filter(Boolean);
    if (!werte.length) continue;
    const pos = w => { const i = WAHL[art].werte.findIndex(x => x[0] === w); return i < 0 ? 0.5 : 1 - i / 2; };
    const mitte = werte.reduce((n, w) => n + pos(w), 0) / werte.length;
    const wort = WAHL[art].werte[mitte >= 0.75 ? 0 : mitte <= 0.25 ? 2 : 1][1];
    rahmen.push(`<div class="rahmen-zeile"><span class="rahmen-name">${WAHL[art].name}</span>${skala(art, werte, pos, mitte, wort)}<span class="rahmen-kurz">${werte.length > 1 ? 'eher ' : ''}${wort}</span></div>`);
  }
  if (abende.length) {
    const kurz = abende.length > 1 ? `meist ${median(abende.map(a => zuMin(a.z)))}` : abende[0].z;
    rahmen.push(`<div class="rahmen-zeile"><span class="rahmen-name">Feierabend</span>${abendMini(abende)}<span class="rahmen-kurz">${kurz}</span></div>`);
  }
  if (rahmen.length) teile.push(`<div class="card"><div class="card-header"><h2>Rahmen des Tages</h2></div><div class="rahmen-liste">${rahmen.join('')}</div></div>`);

  // Woche abschließen: der eine Ort zum Nachdenken. Angebote nur, wenn es diese Woche welche gab.
  const angebote = S.momente.filter(m => m.angebot && taps.some(t => t.mid === m.id));
  const seg = (mid, feld, optionen) => `<div class="seg klein" data-mid="${esc(mid)}" data-feld="${feld}">${optionen.map(([w, t]) =>
    `<button type="button" data-wert="${w}" class="${notiz.angebote?.[mid]?.[feld] === w ? 'an' : ''}">${t}</button>`).join('')}</div>`;
  const frage = REFLEXION[kw(start) % REFLEXION.length];
  teile.push(`<div class="card"><details class="wgruppe abschluss"><summary class="gruppe-zeile rueck-zeile">
      <span class="gruppe-name">Woche abschließen</span><span class="rahmen-kurz" id="abschluss-stand">${notiz.abgeschlossen ? 'abgeschlossen' : ''}</span><span class="auf" aria-hidden="true">›</span></summary>
    <div class="abschluss-inhalt">
      ${angebote.length ? `<div class="label">Angebote</div>${angebote.map(m => `<div class="angebot" data-angebot="${esc(m.id)}">
        <div class="angebot-name">${herzHTML(['angekommen', 'getragen'].includes(notiz.angebote?.[m.id]?.an))} ${esc(m.name)}</div>
        <div class="angebot-frage">Wie kam es an?</div>${seg(m.id, 'an', [['offen', 'offen'], ['angekommen', 'angekommen'], ['getragen', 'hat getragen']])}
        <div class="angebot-frage">Hat es mir auch etwas gegeben?</div>${seg(m.id, 'mir', [['wenig', 'wenig'], ['etwas', 'etwas'], ['viel', 'viel']])}
      </div>`).join('')}` : ''}
      <div class="label">Eine Frage</div>
      <p class="reflexion">${frage}</p>
      <textarea id="abschluss-satz" rows="3" maxlength="400" placeholder="Wenn du magst, ein Satz. Kann auch leer bleiben.">${esc(notiz.satz || '')}</textarea>
      <button class="btn-primary" id="btn-abschluss" type="button">${notiz.abgeschlossen ? 'Gespeichert' : 'Woche abschließen'}</button>
    </div></details></div>`);

  $('#woche-inhalt').innerHTML = teile.join('');

  // Über den Tag: erholsam / aktiv ein- und ausblenden (ohne die übrigen Karten neu zu zeichnen)
  document.querySelectorAll('#woche-inhalt [data-filter]').forEach(btn => btn.onclick = () => {
    const f = btn.dataset.filter; heatFilter[f] = !heatFilter[f];
    btn.classList.toggle('an', heatFilter[f]); btn.setAttribute('aria-pressed', heatFilter[f]);
    $('#tag-karte').innerHTML = tagKarte(taps, tage);
  });
  // Woche abschließen
  const notizSchreiben = () => (S.wochen[wk] ||= {});
  document.querySelectorAll('#woche-inhalt .abschluss .seg').forEach(sg => sg.addEventListener('click', e => {
    const bt = e.target.closest('[data-wert]'); if (!bt) return;
    const n = notizSchreiben(), a = (n.angebote ||= {})[sg.dataset.mid] ||= {};
    a[sg.dataset.feld] = a[sg.dataset.feld] === bt.dataset.wert ? undefined : bt.dataset.wert;
    sg.querySelectorAll('button').forEach(x => x.classList.toggle('an', x.dataset.wert === a[sg.dataset.feld]));
    const voll = ['angekommen', 'getragen'].includes(a.an);
    sg.closest('.angebot').querySelector('.herz-wrap').classList.toggle('voll', voll);
    speichern();
  }));
  const satz = $('#abschluss-satz');
  if (satz) satz.oninput = () => { notizSchreiben().satz = satz.value.trim() || undefined; speichern(); };
  const btnAb = $('#btn-abschluss');
  if (btnAb) btnAb.onclick = () => {
    notizSchreiben().abgeschlossen = Date.now(); speichern();
    btnAb.textContent = 'Gespeichert'; $('#abschluss-stand').textContent = 'abgeschlossen';
    btnAb.closest('details').open = false;
    toast('Woche abgeschlossen. Es ist nichts mehr offen.');
  };
  // „▸ Alle“: öffnet bzw. schließt alle Zeilen einer Karte; passt sich an, wenn Zeilen einzeln geöffnet werden
  document.querySelectorAll('#woche-inhalt .btn-alle').forEach(btn => {
    const zeilen = [...btn.closest('.card').querySelectorAll('details.wgruppe')];
    const anzeigen = () => {
      const alle = zeilen.length > 0 && zeilen.every(d => d.open);
      btn.classList.toggle('offen', alle);
      btn.setAttribute('aria-expanded', alle);
      btn.setAttribute('aria-label', alle ? 'Alle Zeilen schließen' : 'Alle Zeilen öffnen');
    };
    btn.onclick = () => { const auf = !zeilen.every(d => d.open); zeilen.forEach(d => { d.open = auf; }); anzeigen(); };
    zeilen.forEach(d => d.addEventListener('toggle', anzeigen));
    anzeigen();
  });
}

// ── Über den Tag ──
const heatFilter = { erholsam: true, fuermich: true, aktiv: false };
const REFLEXION = ['Was hat dir diese Woche gutgetan?', 'Welche Ruheinsel möchtest du behalten?', 'Was darf nächste Woche etwas weniger sein?', 'Wofür bist du diese Woche dankbar?'];
// Art eines Moments in der Karte: erholsam, aktiv für mich oder aktiv
const ART = { reg: 'reg', beides: 'mich', akt: 'akt' };
const ART_FILTER = { reg: 'erholsam', mich: 'fuermich', akt: 'aktiv' };
const WOLKE_RGB = { reg: '246,240,228', mich: '134,189,181', akt: '217,163,106' };
function tagKarte(taps, tage) {
  const W = 320, H = 300, L = 30, R = 8, T = 10, B = 26;
  // getippt wird am Ende: die Wolke liegt auf der Mitte des Moments
  const pts = taps.map(t => { const m = moment(t.mid); return { t, m, art: m && (ART[m.modus] || 'reg'), d: new Date(t.ts - (t.min || 0) * 30000) }; })
    .filter(p => p.m && heatFilter[ART_FILTER[p.art]]);
  const stunde = d => d.getHours() + d.getMinutes() / 60;
  const fa = tage.map((d, i) => ({ i, z: S.feierabend[tagKey(d)] })).filter(x => x.z).map(x => ({ i: x.i, h: zuMin(x.z) / 60 }));
  const alle = [...pts.map(p => stunde(p.d)), ...fa.map(f => f.h)];
  const hMin = Math.min(7, Math.floor(Math.min(...alle, 24)) - 1), hMax = Math.max(23, Math.ceil(Math.max(...alle, 0)) + 1);
  const spalte = (W - L - R) / 7;
  const x = i => L + (i + 0.5) * spalte, y = h => T + (h - hMin) / (hMax - hMin) * (H - T - B);
  const proStunde = (H - T - B) / (hMax - hMin);
  const tagNamen = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  let achsen = tagNamen.map((n, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="tag-achse">${n}</text>`).join('');
  for (let h = Math.ceil(hMin / 4) * 4; h <= hMax; h += 4) achsen += `<text x="${L - 8}" y="${(y(h) + 3).toFixed(1)}" text-anchor="end" class="tag-achse">${h}</text>`;
  const striche = fa.map(f => `<line x1="${(x(f.i) - spalte * 0.32).toFixed(1)}" x2="${(x(f.i) + spalte * 0.32).toFixed(1)}" y1="${y(f.h).toFixed(1)}" y2="${y(f.h).toFixed(1)}" class="tag-feierabend"/>`).join('');
  // gleiche Breite für alle, die Länge folgt der Dauer: lange Momente überdecken kurze nicht mehr
  const RANG = { akt: 0, mich: 1, reg: 2 };
  const glow = pts.map(p => {
    const i = (p.d.getDay() + 6) % 7, halb = (p.t.min || 0) / 120 * proStunde;
    return { cx: x(i) + ((p.t.ts / 60000) % 7 - 3) * 0.9, cy: y(stunde(p.d)), rx: 10, ry: halb + 8, art: p.art };
  }).sort((a, b) => RANG[a.art] - RANG[b.art]);   // aktiv unten, erholsam oben
  const schein = glow.map(g => `<ellipse cx="${g.cx.toFixed(1)}" cy="${g.cy.toFixed(1)}" rx="${g.rx}" ry="${g.ry.toFixed(1)}" fill="url(#wolke-${g.art})"/>`).join('');
  const kerne = glow.map(g => `<circle cx="${g.cx.toFixed(1)}" cy="${g.cy.toFixed(1)}" r="1.3" class="tag-kern ${g.art}"/>`).join('');
  const verlauf = (art, rgb) => `<radialGradient id="wolke-${art}"><stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${art === 'mich' ? 0.8 : 0.55}"/><stop offset="0.45" stop-color="rgb(${rgb})" stop-opacity="${art === 'mich' ? 0.38 : 0.25}"/><stop offset="1" stop-color="rgb(${rgb})" stop-opacity="0"/></radialGradient>`;
  return `<svg class="tag-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wann die Momente dieser Woche lagen, ${pts.length} Momente">
    <defs>${Object.entries(WOLKE_RGB).map(([a, r]) => verlauf(a, r)).join('')}</defs>
    ${achsen}${striche}${schein}${kerne}</svg>`;
}

// Feierabend als schmale Zeitachse: Korridor als weiches Band, ein Punkt pro Abend, nur die Endstunden beschriftet
function abendMini(abende) {
  const kv = zuMin(S.einstellungen.korridorVon), kb = zuMin(S.einstellungen.korridorBis);
  const zeiten = abende.map(a => zuMin(a.z));
  const von = Math.floor((Math.min(kv, ...zeiten) - 15) / 60) * 60, bis = Math.ceil((Math.max(kb, ...zeiten) + 15) / 60) * 60;
  const W = 150, x0 = 10, x1 = W - 10, y = 11;
  const x = m => x0 + (m - von) / (bis - von) * (x1 - x0);
  const punkte = zeiten.map(m => `<circle cx="${x(m).toFixed(1)}" cy="${y}" r="4.2" class="mini-punkt"/>`).join('');
  return `<svg class="mini" viewBox="0 0 ${W} 32" role="img" aria-label="Feierabende im Verhältnis zum Korridor ${S.einstellungen.korridorVon} bis ${S.einstellungen.korridorBis}">
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="mini-achse"/>
    <rect x="${x(kv).toFixed(1)}" y="${y - 7}" width="${(x(kb) - x(kv)).toFixed(1)}" height="14" rx="7" class="mini-band"/>
    ${punkte}
    <text x="${x0}" y="30" class="mini-text">${pad(von / 60 % 24)}</text><text x="${x1}" y="28" text-anchor="end" class="mini-text">${pad(bis / 60 % 24)}</text></svg>`;
}
// Gefühlte Werte als Skala (z. B. kurz bis erholt): ein blasser Punkt je Tag, ein Ring für die Mitte der Woche
function skala(art, werte, pos, mitte, wort) {
  const W = 150, x0 = 10, x1 = W - 10, y = 11;
  const x = v => x0 + v * (x1 - x0);
  // gleiche Werte liegen nebeneinander, mittig um ihren Platz
  const anzahl = {}, zaehler = {};
  werte.forEach(w => { anzahl[w] = (anzahl[w] || 0) + 1; });
  const punkte = werte.map(w => {
    const k = zaehler[w] = (zaehler[w] || 0) + 1;
    const dx = (k - 1 - (anzahl[w] - 1) / 2) * 7;
    return `<circle cx="${(x(pos(w)) + dx).toFixed(1)}" cy="${y}" r="3.2" class="mini-nacht"/>`;
  }).join('');
  const [oben, , unten] = WAHL[art].werte.map(v => v[1]);
  return `<svg class="mini" viewBox="0 0 ${W} 32" role="img" aria-label="${WAHL[art].name} der Woche, eher ${wort}">
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="mini-achse"/>
    <line x1="${x(0.5)}" y1="${y - 3}" x2="${x(0.5)}" y2="${y + 3}" class="mini-achse"/>
    ${punkte}
    <circle cx="${x(mitte).toFixed(1)}" cy="${y}" r="6.5" class="mini-mitte"/>
    <text x="${x0}" y="30" class="mini-text">${unten}</text><text x="${x1}" y="28" text-anchor="end" class="mini-text">${oben}</text></svg>`;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  const v = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  return zuHHMM(Math.round(v / 5) * 5);
}

function abendSVG(abende) {
  const kv = zuMin(S.einstellungen.korridorVon), kb = zuMin(S.einstellungen.korridorBis);
  const zeiten = abende.map(a => zuMin(a.z));
  let von = Math.floor((Math.min(kv, ...zeiten) - 30) / 60) * 60;
  let bis = Math.ceil((Math.max(kb, ...zeiten) + 30) / 60) * 60;
  const W = 320, x0 = 12, x1 = W - 12, y = 46;
  const x = m => x0 + (m - von) / (bis - von) * (x1 - x0);
  let ticks = '';
  const schritt = (bis - von) > 360 ? 120 : 60;
  for (let m = von; m <= bis; m += schritt) ticks += `<line x1="${x(m)}" y1="${y - 3}" x2="${x(m)}" y2="${y + 3}" stroke="rgba(255,255,255,.18)"/><text x="${x(m)}" y="${y + 18}" text-anchor="middle">${pad(m / 60 % 24)}</text>`;
  const sortiert = abende.map(a => ({ ...a, m: zuMin(a.z) })).sort((p, q) => p.m - q.m);
  let letzteX = -99, oben = true;
  const punkte = sortiert.map(a => {
    const px = x(a.m);
    if (px - letzteX < 22) oben = !oben; else oben = true;
    letzteX = px;
    const tag = a.d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
    return `<circle cx="${px}" cy="${y}" r="5" style="fill:rgb(var(--abend-rgb))" stroke="#0d0d11" stroke-width="2"><title>${tag} ${a.z}</title></circle>
      <text class="tag-label" x="${px}" y="${oben ? y - 12 : y + 30}" text-anchor="middle">${tag}</text>`;
  }).join('');
  return `<svg class="abend-svg" viewBox="0 0 ${W} 100" role="img" aria-label="Feierabende auf einer Zeitachse">
    <rect x="${x(kv)}" y="${y - 9}" width="${x(kb) - x(kv)}" height="18" rx="9" fill="rgba(169,180,222,.14)"/>
    <text x="${(x(kv) + x(kb)) / 2}" y="${y + 50}" text-anchor="middle" style="font-size:9px">Korridor ${S.einstellungen.korridorVon}–${S.einstellungen.korridorBis}</text>
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="rgba(255,255,255,.14)" stroke-width="1.5" stroke-linecap="round"/>
    ${ticks}${punkte}</svg>`;
}

// ── VERWALTUNG ─────────────────────────────────────────
function renderVerwaltung() {
  // Gruppen als Überschriften, darunter ihre Momente. Gleiche Reihenfolge wie auf Heute und in der Woche.
  const sort = sortiermodus;
  $('#btn-sort').textContent = sort ? 'Fertig' : 'Reihenfolge ändern';
  $('#btn-sort').classList.toggle('an', sort);
  $('#sort-hinweis').classList.toggle('hidden', !sort);
  const info = m => [MODI[m.modus], m.dauer ? fmtDauer(m.dauer) : '', m.etwa ? `etwa ${m.etwa} × pro Woche` : ''].filter(Boolean).join(' · ');
  const zeile = (m, i, liste) => sort
    ? `<div class="moment-zeile sortieren">
      <span class="sym" aria-hidden="true">${symbolHTML(m)}</span>
      <span class="nm">${esc(m.name)}<span class="info" style="display:block">${info(m)}</span></span>
      ${pfeile('m', m.id, i, liste.length, m.name)}</div>`
    : `<button class="moment-zeile" type="button" data-edit="${esc(m.id)}">
      <span class="sym" aria-hidden="true">${symbolHTML(m)}</span>
      <span class="nm">${esc(m.name)}<span class="info" style="display:block">${info(m)}</span></span>
      <span class="modus-punkt ${m.modus}" aria-hidden="true"></span></button>`;
  $('#gm-liste').innerHTML = [...S.gruppen.map(g => g.id), ''].map((g, gi) => {
    const liste = S.momente.filter(m => g ? m.gruppe === g : !GRUPPEN[m.gruppe]);
    if (!g && !liste.length) return '';
    const name = g ? GRUPPEN[g] : 'Ohne Gruppe';
    const kopf = !g ? `<div class="gm-gruppe"><span class="nm">${esc(name)}</span></div>`
      : sort ? `<div class="gm-gruppe sortieren"><span class="nm">${esc(name)}</span>${pfeile('g', g, gi, S.gruppen.length, name)}</div>`
      : `<button class="gm-gruppe" type="button" data-gruppe="${esc(g)}" aria-label="Gruppe ${esc(name)} bearbeiten"><span class="nm">${esc(name)}</span><span class="pfeil" aria-hidden="true">›</span></button>`;
    return `<div class="gm-block">${kopf}${liste.map(zeile).join('')}${!sort && g ? `<button class="moment-zeile gm-neu" type="button" data-neu-moment="${esc(g)}"><span class="sym" aria-hidden="true"><span class="plus-kreis">+</span></span><span class="nm">Moment hinzufügen</span></button>` : ''}</div>`;
  }).join('');
  for (const art of Object.keys(WAHL)) $('#zeige-' + art).checked = wahlAn(art);
  $('#korridor-von').value = S.einstellungen.korridorVon;
  $('#korridor-bis').value = S.einstellungen.korridorBis;
  document.querySelectorAll('#seg-balance-stil button').forEach(b => b.classList.toggle('an', b.dataset.stil === S.einstellungen.balanceStil));
}

function momentSheet(id, gruppeVorwahl) {
  const neu = !id;
  const m = neu ? { id: uid(), name: '', symbol: '', icon: 'gruene', gruppe: gruppeVorwahl || S.gruppen[0]?.id, modus: 'reg', dauer: 30 } : { ...moment(id) };
  const segM = Object.entries(MODI).map(([k, t]) => `<button type="button" data-wert="${k}" class="${m.modus === k ? 'an' : ''}">${t}</button>`).join('');
  sheet(neu ? 'Neuer Moment' : m.name, `
    <div class="form-group"><label for="m-name">Name</label><input type="text" id="m-name" value="${esc(m.name)}" placeholder="z. B. Gartenzeit" maxlength="40"></div>
    <div class="form-group"><label>Piktogramm</label>
      <div class="symbol-wahl" id="m-pikto">${Object.keys(PIKTO).map(k => `<button type="button" data-icon="${k}" class="${m.icon === k ? 'an' : ''}" aria-label="Piktogramm ${k}" aria-pressed="${m.icon === k}">${pikto(k)}</button>`).join('')}
        <button type="button" data-icon="kein" class="kein${hatSymbol(m) ? '' : ' an'}" aria-pressed="${!hatSymbol(m)}">kein Piktogramm</button></div>
      <p class="form-hinweis">Ohne Piktogramm steht der Name größer auf der Kachel.</p></div>
    <div class="form-group"><label>Modus</label><div class="seg modus-seg" id="m-modus">${segM}</div>
      <p class="form-hinweis">Warm für Aktivierung, kühl für Regeneration.</p></div>
    <div class="form-group"><label class="schalter-zeile" for="m-angebot"><input type="checkbox" id="m-angebot"${m.angebot ? ' checked' : ''}><span>Angebot für andere</span></label>
      <p class="form-hinweis">Zeigt ein kleines Herz. Beim Wochenabschluss kannst du festhalten, wie es ankam.</p></div>
    <div class="form-reihe">
      <div class="form-group"><label for="m-gruppe">Gruppe</label><select id="m-gruppe">${Object.entries(GRUPPEN).map(([k, t]) => `<option value="${k}"${m.gruppe === k ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
      <div class="form-group"><label for="m-dauer">Dauer (min)</label><input type="number" id="m-dauer" min="0" max="600" step="5" value="${m.dauer || 0}"></div>
    </div>
    <div class="form-reihe">
      <div class="form-group"><label for="m-etwa">Richtwert / Woche</label><input type="number" id="m-etwa" min="0" max="50" value="${m.etwa || ''}" placeholder="frei">
        <p class="form-hinweis">Etwa so oft. Kein Soll.</p></div>
      <div class="form-group"><label for="m-genug">Genug ab (min / Tag)</label><input type="number" id="m-genug" min="0" max="900" step="15" value="${m.genugTag || ''}" placeholder="frei">
        <p class="form-hinweis">Zeigt leise „genug für heute“.</p></div>
    </div>
    <div class="btn-reihe">
      <button class="btn-primary" id="m-ok" type="button">${neu ? 'Moment anlegen' : 'Speichern'}</button>
      ${neu ? '' : '<button class="btn-leise" id="m-weg" type="button">Moment entfernen …</button>'}
    </div>`);
  let modus = m.modus;
  document.querySelectorAll('#m-modus button').forEach(b => b.onclick = () => {
    modus = b.dataset.wert; document.querySelectorAll('#m-modus button').forEach(x => x.classList.toggle('an', x === b));
  });
  let icon = m.icon;
  document.querySelectorAll('#m-pikto button').forEach(b => b.onclick = () => {
    icon = b.dataset.icon;
    document.querySelectorAll('#m-pikto button').forEach(x => { x.classList.toggle('an', x === b); x.setAttribute('aria-pressed', x === b); });
  });
  $('#m-ok').onclick = () => {
    const name = $('#m-name').value.trim();
    if (!name) { $('#m-name').focus(); $('#m-name').placeholder = 'Bitte einen Namen eingeben'; return; }
    const zahl = v => { const n = parseInt(v, 10); return n > 0 ? n : undefined; };
    delete m.unter;
    Object.assign(m, { name, icon: icon || 'kein', symbol: icon && icon !== 'kein' ? '' : m.symbol, modus, gruppe: $('#m-gruppe').value,
      dauer: zahl($('#m-dauer').value) || 0, etwa: zahl($('#m-etwa').value), genugTag: zahl($('#m-genug').value),
      angebot: $('#m-angebot').checked || undefined });
    if (neu) S.momente.push(m); else S.momente[S.momente.findIndex(x => x.id === m.id)] = m;
    speichern(); sheetZu(); renderAlles(); toast(neu ? `${name} angelegt` : 'Gespeichert');
  };
  if (!neu) $('#m-weg').onclick = () => {
    const n = S.taps.filter(t => t.mid === m.id).length;
    sheet('Moment entfernen', `<p class="card-text">„${esc(m.name)}“ verschwindet von den Kacheln${n ? `, und die ${n} gezählten Einträge werden gelöscht` : ''}. Das lässt sich nicht rückgängig machen.</p>
      <div class="btn-reihe"><button class="btn-primary" id="weg-ja" type="button">Entfernen</button><button class="btn-leise" id="weg-nein" type="button">Behalten</button></div>`);
    $('#weg-ja').onclick = () => { S.momente = S.momente.filter(x => x.id !== m.id); S.taps = S.taps.filter(t => t.mid !== m.id); speichern(); sheetZu(); renderAlles(); toast('Moment entfernt'); };
    $('#weg-nein').onclick = () => momentSheet(m.id);
  };
}

// ── GRUPPEN ───────────────────────────────────────────
// ── REIHENFOLGE ────────────────────────────────────────
let sortiermodus = false;
function pfeile(art, id, i, n, name) {
  return `<span class="sort-pfeile">
    <button type="button" data-${art}-hoch="${esc(id)}" ${i === 0 ? 'disabled' : ''} aria-label="${esc(name)} nach oben">↑</button>
    <button type="button" data-${art}-runter="${esc(id)}" ${i === n - 1 ? 'disabled' : ''} aria-label="${esc(name)} nach unten">↓</button></span>`;
}
// Tauscht ein Element mit seinem Nachbarn innerhalb derselben Teilliste (z. B. Momente einer Gruppe)
function verschieben(arr, id, richtung, gleicheListe) {
  const idx = arr.map((x, k) => k).filter(k => gleicheListe(arr[k]));
  const pos = idx.findIndex(k => arr[k].id === id), ziel = pos + richtung;
  if (pos < 0 || ziel < 0 || ziel >= idx.length) return;
  const a = idx[pos], b = idx[ziel];
  [arr[a], arr[b]] = [arr[b], arr[a]];
  gruppenAktualisieren(); speichern(); renderVerwaltung();
  const fokus = document.querySelector(`[data-${arr === S.momente ? 'm' : 'g'}-${richtung < 0 ? 'hoch' : 'runter'}="${CSS.escape(id)}"]`);
  if (fokus && !fokus.disabled) fokus.focus();
}

function gruppeSheet(id) {
  const neu = !id;
  const g = neu ? { id: uid(), name: '' } : S.gruppen.find(x => x.id === id);
  const i = S.gruppen.indexOf(g);
  sheet(neu ? 'Neue Gruppe' : g.name, `
    <div class="form-group"><label for="g-name">Name</label><input type="text" id="g-name" value="${esc(g.name)}" placeholder="z. B. Ehrenamt" maxlength="30"></div>
    <div class="btn-reihe">
      <button class="btn-primary" id="g-ok" type="button">${neu ? 'Gruppe anlegen' : 'Speichern'}</button>
      ${neu ? '' : '<button class="btn-leise" id="g-weg" type="button">Gruppe entfernen …</button>'}
    </div>`);
  $('#g-ok').onclick = () => {
    const name = $('#g-name').value.trim();
    if (!name) { $('#g-name').focus(); $('#g-name').placeholder = 'Bitte einen Namen eingeben'; return; }
    g.name = name; if (neu) S.gruppen.push(g);
    gespeichertNeu(); sheetZu(); toast(neu ? `${name} angelegt` : 'Gespeichert');
  };
  if (neu) return;
  $('#g-weg').onclick = () => {
    const andere = S.gruppen.filter(x => x.id !== g.id);
    if (!andere.length) { toast('Mindestens eine Gruppe bleibt'); return; }
    const n = S.momente.filter(m => m.gruppe === g.id).length;
    sheet('Gruppe entfernen', `<p class="card-text">„${esc(g.name)}“ wird entfernt. Gezählte Einträge bleiben erhalten.</p>
      ${n ? `<div class="form-group"><label for="g-ziel">${n === 1 ? 'Der Moment kommt nach' : `Die ${n} Momente kommen nach`}</label>
        <select id="g-ziel">${andere.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
      <div class="btn-reihe"><button class="btn-primary" id="gw-ja" type="button">Entfernen</button><button class="btn-leise" id="gw-nein" type="button">Behalten</button></div>`);
    $('#gw-ja').onclick = () => {
      const ziel = n ? $('#g-ziel').value : null;
      for (const m of S.momente) if (m.gruppe === g.id) m.gruppe = ziel;
      S.gruppen = andere;
      gespeichertNeu(); sheetZu(); toast('Gruppe entfernt');
    };
    $('#gw-nein').onclick = () => gruppeSheet(g.id);
  };
}

function gespeichertNeu() { gruppenAktualisieren(); speichern(); renderAlles(); }

// ── Sheet, Toast, Navigation ───────────────────────────
function sheet(titel, html) { $('#sheet-titel').textContent = titel; $('#sheet-body').innerHTML = html; $('#sheet').classList.remove('hidden'); }
function sheetZu() { $('#sheet').classList.add('hidden'); }

let toastTimer = null;
function toast(text, rueckgaengig) {
  $('#toast-text').textContent = text;
  const btn = $('#toast-btn');
  btn.classList.toggle('hidden', !rueckgaengig);
  btn.onclick = rueckgaengig ? () => { rueckgaengig(); } : null;
  $('#toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), rueckgaengig ? 5000 : 2200);
}

let ansicht = 'heute', vorAnsicht = 'heute';
function zeige(v) {
  if (v === 'verwaltung' && ansicht !== 'verwaltung') vorAnsicht = ansicht;
  if (v !== 'verwaltung') sortiermodus = false;
  ansicht = v;
  document.documentElement.classList.toggle('snap-heute', v === 'heute');   // Heute: schnelles Wischen hält an jeder Gruppe
  ['heute', 'woche', 'verwaltung'].forEach(n => $('#view-' + n).classList.toggle('hidden', n !== v));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  renderAlles();
  window.scrollTo(0, 0);
}
function renderAlles() {
  const inEinst = ansicht === 'verwaltung';
  $('#btn-einstellungen').classList.toggle('an', inEinst);
  $('#btn-einstellungen').setAttribute('aria-pressed', inEinst);
  if (ansicht === 'heute') renderHeute();
  if (ansicht === 'woche') renderWoche();
  if (ansicht === 'verwaltung') renderVerwaltung();
}

// ── Start ──────────────────────────────────────────────
function verbinden() {
  const raster = $('#moment-kacheln'), sonder = $('#sonder-kacheln');
  for (const r of [raster, sonder]) {
    r.addEventListener('pointerdown', druckStart);
    r.addEventListener('pointerup', druckEnde);
    r.addEventListener('pointercancel', druckAbbruch);
    r.addEventListener('pointerleave', druckAbbruch, true);
    r.addEventListener('pointermove', druckBewegt);
    r.addEventListener('contextmenu', e => e.preventDefault());
    r.addEventListener('keydown', e => {
      const el = e.target.closest('.kachel[data-mid], .kachel[data-sonder="feierabend"]');
      if (!el || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      if (el.dataset.mid) { if (e.shiftKey) zuruecknehmen(el.dataset.mid); else zaehlen(el.dataset.mid); }
      else if (S.feierabend[heuteKey()]) feierabendSheet(); else feierabendJetzt();
    });
  }
  sonder.addEventListener('click', e => {
    const b = e.target.closest('[data-wahl]'); if (!b) return;
    const k = heuteKey(), art = b.dataset.wahl, w = b.dataset.wert, m = (S[art] ||= {});
    if (m[k] === w) delete m[k]; else m[k] = w;
    speichern(); renderHeute();
  });

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => zeige(b.dataset.view)));
  // Einstellungen: Zahnrad oben rechts öffnet und schließt, „‹ Zurück“ führt zur vorigen Ansicht
  $('#btn-einstellungen').onclick = () => zeige(ansicht === 'verwaltung' ? vorAnsicht : 'verwaltung');
  $('#btn-zurueck').onclick = () => zeige(vorAnsicht);
  $('#btn-info').onclick = () => $('#hilfe').classList.remove('hidden');
  $('#hilfe-zu').onclick = () => $('#hilfe').classList.add('hidden');
  $('#sheet-zu').onclick = sheetZu;
  for (const id of ['#sheet', '#hilfe']) $(id).addEventListener('click', e => { if (e.target === $(id)) $(id).classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { sheetZu(); $('#hilfe').classList.add('hidden'); } });

  $('#woche-zurueck').onclick = () => { wocheVersatz--; renderWoche(); };
  $('#woche-vor').onclick = () => { if (wocheVersatz < 0) { wocheVersatz++; renderWoche(); } };

  $('#gm-liste').addEventListener('click', e => {
    const mh = e.target.closest('[data-m-hoch],[data-m-runter]');
    if (mh) {
      const id = mh.dataset.mHoch || mh.dataset.mRunter, m = moment(id);
      const g = GRUPPEN[m.gruppe] ? m.gruppe : null;
      verschieben(S.momente, id, mh.dataset.mHoch ? -1 : 1, x => g ? x.gruppe === g : !GRUPPEN[x.gruppe]);
      return;
    }
    const gh = e.target.closest('[data-g-hoch],[data-g-runter]');
    if (gh) { verschieben(S.gruppen, gh.dataset.gHoch || gh.dataset.gRunter, gh.dataset.gHoch ? -1 : 1, () => true); return; }
    const neu = e.target.closest('[data-neu-moment]'); if (neu) { momentSheet(null, neu.dataset.neuMoment); return; }
    const b = e.target.closest('[data-edit]'); if (b) { momentSheet(b.dataset.edit); return; }
    const g = e.target.closest('[data-gruppe]'); if (g) gruppeSheet(g.dataset.gruppe);
  });
  $('#btn-sort').onclick = () => { sortiermodus = !sortiermodus; renderVerwaltung(); };
  $('#btn-gruppe-neu').onclick = () => gruppeSheet(null);
  const korridorNeu = () => {
    const von = $('#korridor-von').value, bis = $('#korridor-bis').value;
    if (!von || !bis) return;
    S.einstellungen.korridorVon = von; S.einstellungen.korridorBis = bis;
    if (korridorPruefen(S.einstellungen)) { $('#korridor-bis').value = S.einstellungen.korridorBis; toast(`„spätestens“ muss nach „ab“ liegen: ${S.einstellungen.korridorBis}`); }
    speichern();
  };
  $('#korridor-von').onchange = korridorNeu;
  $('#korridor-bis').onchange = korridorNeu;
  for (const art of Object.keys(WAHL)) $('#zeige-' + art).onchange = e => { S.einstellungen['zeige_' + art] = e.target.checked; speichern(); renderHeute(); };
  document.querySelectorAll('#seg-balance-stil button').forEach(b => b.onclick = () => { S.einstellungen.balanceStil = b.dataset.stil; speichern(); renderVerwaltung(); });
  $('#btn-alles-loeschen').onclick = () => {
    sheet('Alle Einträge löschen', `<p class="card-text">Gezählte Momente, Feierabende und Schlaf-Einträge werden von diesem Gerät gelöscht. Die Momente selbst und die Einstellungen bleiben. Das lässt sich nicht rückgängig machen.</p>
      <div class="btn-reihe"><button class="btn-primary" id="del-ja" type="button">Einträge löschen</button><button class="btn-leise" id="del-nein" type="button">Abbrechen</button></div>`);
    $('#del-ja').onclick = () => { S.taps = []; S.feierabend = {}; S.schlaf = {}; S.essen = {}; S.trinken = {}; speichern(); sheetZu(); renderAlles(); toast('Einträge gelöscht'); };
    $('#del-nein').onclick = sheetZu;
  };

  // Sicherung als Datei (zum Mitnehmen auf ein anderes Gerät)
  $('#btn-export').onclick = () => {
    const daten = JSON.stringify({ app: 'MemoMe', exportiert: new Date().toISOString(), zustand: S }, null, 1);
    const url = URL.createObjectURL(new Blob([daten], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `MemoMe-Sicherung-${heuteKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Sicherung erstellt');
  };
  $('#btn-import').onclick = () => $('#import-datei').click();
  $('#import-datei').onchange = async e => {
    const datei = e.target.files[0]; e.target.value = '';
    if (!datei) return;
    let neu;
    try { const j = JSON.parse(await datei.text()); neu = j.app === 'MemoMe' ? j.zustand : null; } catch { neu = null; }
    if (!neu || neu.version !== 1 || !Array.isArray(neu.momente)) { toast('Diese Datei ist keine MemoMe-Sicherung'); return; }
    sheet('Sicherung laden', `<p class="card-text">Die Sicherung enthält ${neu.momente.length === 1 ? '1 Moment' : neu.momente.length + ' Momente'} und ${(n => n === 1 ? '1 Eintrag' : n + ' Einträge')((neu.taps || []).length)}. Sie ersetzt alles, was jetzt auf diesem Gerät gespeichert ist.</p>
      <div class="btn-reihe"><button class="btn-primary" id="imp-ja" type="button">Sicherung laden</button><button class="btn-leise" id="imp-nein" type="button">Abbrechen</button></div>`);
    $('#imp-ja').onclick = () => { S = zustandAus(neu); gruppenAktualisieren(); speichern(); sheetZu(); renderAlles(); toast('Sicherung geladen'); };
    $('#imp-nein').onclick = sheetZu;
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAlles(); });
}

// Gespeicherten oder importierten Zustand auf den aktuellen Datenstand bringen
// Korridor: „bis“ muss nach „von“ liegen (gleicher Abend). Sonst bis = von + 1 Stunde.
function korridorPruefen(e) {
  const v = zuMin(e.korridorVon), b = zuMin(e.korridorBis);
  if (b > v) return false;
  e.korridorBis = zuHHMM(Math.min(v + 60, 23 * 60 + 59));
  return true;
}

function zustandAus(alt) {
  const z = { ...startZustand(), ...alt, einstellungen: { ...startZustand().einstellungen, ...alt.einstellungen } };
  if (!(alt.stand >= 3)) {
    // Stand 3: Piktogramme für die Startmomente
    for (const m of z.momente) { const st = START_MOMENTE.find(x => x.id === m.id); if (st && !m.icon) m.icon = st.icon; }
  }
  if (!(alt.stand >= 4)) {
    // Stand 4: Gruppen werden Daten
    z.gruppen = START_GRUPPEN.map(x => ({ ...x }));
  }
  if (!(alt.stand >= 5)) {
    // Stand 5: keine Untergruppen mehr; die Momente bleiben in ihrer Gruppe
    delete z.untergruppen;
    for (const m of z.momente) delete m.unter;
    z.stand = 5;
  }
  korridorPruefen(z.einstellungen);
  return z;
}

// Hinweis „Neue Version verfügbar“ (wie MemoFix)
function zeigeUpdateHinweis() {
  if (document.getElementById('update-hinweis')) return;
  const el = document.createElement('div');
  el.id = 'update-hinweis'; el.className = 'update-hinweis'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>Neue Version verfügbar</span>
    <button type="button" data-u="neu">Neu laden</button>
    <button type="button" data-u="zu" aria-label="Später">✕</button>`;
  el.addEventListener('click', e => {
    const a = e.target.closest('[data-u]')?.dataset.u;
    if (a === 'neu') location.reload(); else if (a === 'zu') el.remove();
  });
  document.body.appendChild(el);
}

(async function start() {
  const gespeichert = await laden();
  if (gespeichert && gespeichert.version === 1) { S = zustandAus(gespeichert); speichern(); }
  gruppenAktualisieren();
  verbinden();
  zeige('heute');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const hatteController = !!navigator.serviceWorker.controller;   // beim allerersten Besuch kein Hinweis
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Beim Zurückkehren in die App nach einer neuen Version suchen (iPhone-Apps bleiben lange im Hintergrund)
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hatteController) zeigeUpdateHinweis(); });
  }
})();
