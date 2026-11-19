/* MemoMe – erster Prototyp
   Keine Leistungs-App: sammeln statt fordern, zeigen was da war, nie was fehlt. */
'use strict';

// ── Grunddaten ─────────────────────────────────────────
const GRUPPEN = { family: 'Family', social: 'Social', metime: 'Me-Time' };
const MODI = { akt: 'Aktivierung', reg: 'Regeneration', beides: 'beides' };
const SCHLAF = { erholt: 'erholt', mittel: 'mittel', kurz: 'kurz' };
const SYMBOLE = ['☕','🎻','🏃','🧘','🚶','📖','📵','👨‍👩‍👧','💑','🍻','💻','🎨','🌿','🚴','🏊','🎶','🧑‍🍳','🛀','🌙','🤝','🎭'];

const START_MOMENTE = [
  { id: 'kaffee',      name: 'Kaffeepause',          symbol: '☕', gruppe: 'social', modus: 'reg',    dauer: 15 },
  { id: 'cello',       name: 'Cello',                symbol: '🎻', gruppe: 'metime', modus: 'reg',    dauer: 30 },
  { id: 'sport',       name: 'Sport / Joggen',       symbol: '🏃', gruppe: 'metime', modus: 'akt',    dauer: 30 },
  { id: 'meditation',  name: 'Meditation',           symbol: '🧘', gruppe: 'metime', modus: 'reg',    dauer: 10 },
  { id: 'spaziergang', name: 'Spaziergang',          symbol: '🚶', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'lesen',       name: 'Lesen',                symbol: '📖', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'offline',     name: 'Offline',              symbol: '📵', gruppe: 'metime', modus: 'reg',    dauer: 60 },
  { id: 'familie',     name: 'Familienzeit',         symbol: '👨‍👩‍👧', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'zuzweit',     name: 'Zeit zu zweit',        symbol: '💑', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'freunde',     name: 'Freunde treffen',      symbol: '🍻', gruppe: 'social', modus: 'beides', dauer: 60 },
  { id: 'vibe',        name: 'Vibe Coding',          symbol: '💻', gruppe: 'metime', modus: 'akt',    dauer: 30, genugTag: 120 },
];

function startZustand() {
  return {
    version: 1,
    momente: START_MOMENTE.map(m => ({ ...m })),
    taps: [],            // { id, mid, ts, min }
    feierabend: {},      // 'JJJJ-MM-TT' → 'HH:MM'
    schlaf: {},          // 'JJJJ-MM-TT' → 'erholt' | 'mittel' | 'kurz'
    einstellungen: { korridorVon: '17:30', korridorBis: '19:00', balanceStil: 'band', modus: 'einfach' },
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
    ${schale(lx, ly, '226,162,113', fa)}
    ${schale(rx, ry, '127,188,204', fr)}
    <text x="${lx}" y="${ly + 66}" text-anchor="middle" fill="rgba(226,162,113,.9)" font-size="11" font-family="Inter, sans-serif">Aktivität</text>
    <text x="${rx}" y="${ry + 66}" text-anchor="middle" fill="rgba(127,188,204,.9)" font-size="11" font-family="Inter, sans-serif">Regeneration</text>
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
  const sl = S.schlaf[k];
  $('#sonder-kacheln').innerHTML = `
    <button class="kachel abend${fa ? ' gefuellt' : ''}" data-sonder="feierabend" type="button">
      <span class="kachel-symbol" aria-hidden="true">🏁</span>
      <span class="kachel-wert">${fa ? `<span class="kachel-zahl">${fa}</span>` : ''}</span>
      <span><span class="kachel-name">Arbeitstag abgeschlossen</span>
      ${fa ? '<span class="kachel-zusatz" style="display:block">Raum für danach</span>' : ''}</span>
      ${ringSVG()}
    </button>
    <div class="kachel schlaf${sl ? ' gefuellt' : ''}" data-sonder="schlaf">
      <span class="kachel-symbol" aria-hidden="true">😴</span>
      <span class="kachel-name">Schlaf, gefühlt</span>
      <div class="schlaf-wahl" role="group" aria-label="Schlaf gefühlt">
        ${Object.entries(SCHLAF).map(([w, t]) => `<button type="button" data-schlaf="${w}" class="${sl === w ? 'an' : ''}" aria-pressed="${sl === w}">${t}</button>`).join('')}
      </div>
    </div>`;

  // Momente
  const proMoment = {};
  for (const t of taps) { const p = proMoment[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min || 0; }
  $('#moment-kacheln').innerHTML = S.momente.map(m => {
    const p = proMoment[m.id];
    let wert = '', zusatz = '';
    if (p) {
      wert = m.dauer > 0
        ? `<span class="kachel-zahl">${fmtDauer(p.min)}</span><span class="kachel-dauer">${p.n}×</span>`
        : `<span class="kachel-zahl">${p.n}×</span>`;
      if (m.genugTag && p.min >= m.genugTag) zusatz = '<span class="kachel-genug">genug für heute</span>';
    }
    return `<button class="kachel ${m.modus}${p ? ' gefuellt' : ''}" data-mid="${esc(m.id)}" type="button" aria-label="${esc(m.name)}${p ? ', heute ' + p.n + ' mal' : ''}">
      <span class="kachel-symbol" aria-hidden="true">${esc(m.symbol)}</span>
      <span class="kachel-wert">${wert}</span>
      <span><span class="kachel-name">${esc(m.name)}</span>${zusatz ? '<br>' + zusatz : ''}</span>
      ${ringSVG()}
    </button>`;
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
const DRUCK_MS = 1000;
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
  const tage = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); tage.push(d); }
  const abende = tage.map(d => ({ d, z: S.feierabend[tagKey(d)] })).filter(x => x.z);
  const schlaf = {}; tage.forEach(d => { const s = S.schlaf[tagKey(d)]; if (s) schlaf[s] = (schlaf[s] || 0) + 1; });

  const teile = [];
  const gesamtMin = taps.reduce((s, t) => s + (t.min || 0), 0);
  teile.push(`<div class="card">${balanceHTML(b, S.einstellungen.balanceStil, 'Balance der Woche')}
    ${taps.length ? `<p class="card-text" style="margin:0.75rem 0 0">${taps.length} Momente${gesamtMin ? ` · ${fmtDauer(gesamtMin)} gesammelt` : ''}</p>` : ''}</div>`);

  if (!taps.length && !abende.length && !Object.keys(schlaf).length) {
    teile.push(`<div class="card"><p class="leer-text">In dieser Woche ist noch nichts gesammelt. Das ist in Ordnung.</p></div>`);
  }

  if (taps.length) {
    const pm = {};
    for (const t of taps) { const p = pm[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min || 0; }
    const zeilen = S.momente.filter(m => pm[m.id]).map(m => {
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
        <span class="summe-symbol" aria-hidden="true">${esc(m.symbol)}</span>
        <span class="summe-name">${esc(m.name)}</span>
        <span class="summe-wert"><strong>${p.n} ×</strong>${p.min ? ' · ' + fmtDauer(p.min) : ''}</span>
        ${band}</div>`;
    }).join('');
    teile.push(`<div class="card"><div class="card-header"><h2>Was da war</h2></div><div class="summen-liste">${zeilen}</div></div>`);

    const pg = {};
    for (const t of taps) { const m = moment(t.mid); pg[m.gruppe] = (pg[m.gruppe] || 0) + (t.min || 10); }
    const maxG = Math.max(...Object.values(pg));
    const gz = Object.keys(GRUPPEN).filter(g => pg[g]).map(g => `<div class="gruppe-zeile">
        <span class="gruppe-name">${GRUPPEN[g]}</span>
        <span class="gruppe-spur"><span class="gruppe-fuell" style="display:block;width:${Math.max(6, pg[g] / maxG * 100)}%"></span></span>
        <span class="gruppe-wert">${fmtDauer(pg[g])}</span></div>`).join('');
    teile.push(`<div class="card"><div class="card-header"><h2>Gruppen</h2></div><div class="gruppen">${gz}</div></div>`);
  }

  if (abende.length) teile.push(`<div class="card"><div class="card-header"><h2>Feierabende</h2></div>${abendSVG(abende)}
    <p class="card-text" style="margin:0.6rem 0 0">${abende.length === 1 ? 'Ein Feierabend' : abende.length + ' Feierabende'} eingetragen${abende.length > 1 ? `, meist gegen ${median(abende.map(a => zuMin(a.z)))}` : ''}.</p></div>`);

  if (Object.keys(schlaf).length) teile.push(`<div class="card"><div class="card-header"><h2>Schlaf, gefühlt</h2></div>
    <div class="schlaf-chips">${Object.keys(SCHLAF).filter(s => schlaf[s]).map(s => `<span class="chip"><strong>${schlaf[s]} ×</strong>${SCHLAF[s]}</span>`).join('')}</div></div>`);

  $('#woche-inhalt').innerHTML = teile.join('');
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
    <rect x="${x(kv)}" y="${y - 9}" width="${x(kb) - x(kv)}" height="18" rx="9" fill="rgba(201,169,224,.13)"/>
    <text x="${(x(kv) + x(kb)) / 2}" y="${y + 50}" text-anchor="middle" style="font-size:9px">Korridor ${S.einstellungen.korridorVon}–${S.einstellungen.korridorBis}</text>
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="rgba(255,255,255,.14)" stroke-width="1.5" stroke-linecap="round"/>
    ${ticks}${punkte}</svg>`;
}

// ── VERWALTUNG ─────────────────────────────────────────
function renderVerwaltung() {
  $('#momente-anzahl').textContent = S.momente.length;
  $('#momente-liste').innerHTML = S.momente.map(m => `<button class="moment-zeile" type="button" data-edit="${esc(m.id)}">
      <span class="sym" aria-hidden="true">${esc(m.symbol)}</span>
      <span class="nm">${esc(m.name)}<span class="info" style="display:block">${GRUPPEN[m.gruppe]} · ${MODI[m.modus]}${m.dauer ? ' · ' + fmtDauer(m.dauer) : ''}${m.etwa ? ` · etwa ${m.etwa} × pro Woche` : ''}</span></span>
      <span class="modus-punkt ${m.modus}" aria-hidden="true"></span></button>`).join('');
  $('#korridor-von').value = S.einstellungen.korridorVon;
  $('#korridor-bis').value = S.einstellungen.korridorBis;
  document.querySelectorAll('#seg-balance-stil button').forEach(b => b.classList.toggle('an', b.dataset.stil === S.einstellungen.balanceStil));
}

function momentSheet(id) {
  const neu = !id;
  const m = neu ? { id: uid(), name: '', symbol: '🌿', gruppe: 'metime', modus: 'reg', dauer: 30 } : { ...moment(id) };
  const segM = Object.entries(MODI).map(([k, t]) => `<button type="button" data-wert="${k}" class="${m.modus === k ? 'an' : ''}">${t}</button>`).join('');
  sheet(neu ? 'Neuer Moment' : m.name, `
    <div class="form-group"><label for="m-name">Name</label><input type="text" id="m-name" value="${esc(m.name)}" placeholder="z. B. Gartenzeit" maxlength="40"></div>
    <div class="form-group"><label for="m-symbol">Symbol</label><input type="text" id="m-symbol" value="${esc(m.symbol)}" maxlength="8">
      <div class="symbol-wahl">${SYMBOLE.map(s => `<button type="button" data-sym="${s}" aria-label="Symbol ${s}">${s}</button>`).join('')}</div></div>
    <div class="form-group"><label>Modus</label><div class="seg modus-seg" id="m-modus">${segM}</div>
      <p class="form-hinweis">Warm für Aktivierung, kühl für Regeneration.</p></div>
    <div class="form-reihe">
      <div class="form-group"><label for="m-gruppe">Gruppe</label><select id="m-gruppe">${Object.entries(GRUPPEN).map(([k, t]) => `<option value="${k}"${m.gruppe === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
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
  document.querySelectorAll('.symbol-wahl button').forEach(b => b.onclick = () => { $('#m-symbol').value = b.dataset.sym; });
  $('#m-ok').onclick = () => {
    const name = $('#m-name').value.trim();
    if (!name) { $('#m-name').focus(); $('#m-name').placeholder = 'Bitte einen Namen eingeben'; return; }
    const zahl = v => { const n = parseInt(v, 10); return n > 0 ? n : undefined; };
    Object.assign(m, { name, symbol: $('#m-symbol').value.trim() || '•', modus, gruppe: $('#m-gruppe').value,
      dauer: zahl($('#m-dauer').value) || 0, etwa: zahl($('#m-etwa').value), genugTag: zahl($('#m-genug').value) });
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

let ansicht = 'heute';
function zeige(v) {
  if (v === 'verwaltung' && S.einstellungen.modus === 'einfach') v = 'heute';
  ansicht = v;
  ['heute', 'woche', 'verwaltung'].forEach(n => $('#view-' + n).classList.toggle('hidden', n !== v));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  renderAlles();
  window.scrollTo(0, 0);
}
function renderAlles() {
  document.body.classList.toggle('modus-einfach', S.einstellungen.modus === 'einfach');
  $('#btn-modus').textContent = S.einstellungen.modus === 'einfach' ? 'Einfach' : 'Erweitert';
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
    const b = e.target.closest('[data-schlaf]'); if (!b) return;
    const k = heuteKey(), w = b.dataset.schlaf;
    if (S.schlaf[k] === w) delete S.schlaf[k]; else S.schlaf[k] = w;
    speichern(); renderHeute();
  });

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => zeige(b.dataset.view)));
  $('#btn-modus').onclick = () => {
    S.einstellungen.modus = S.einstellungen.modus === 'einfach' ? 'erweitert' : 'einfach';
    speichern();
    if (S.einstellungen.modus === 'einfach' && ansicht === 'verwaltung') zeige('heute'); else renderAlles();
    toast(S.einstellungen.modus === 'einfach' ? 'Einfach: Heute und Woche' : 'Erweitert: mit Verwaltung');
  };
  $('#btn-info').onclick = () => $('#hilfe').classList.remove('hidden');
  $('#hilfe-zu').onclick = () => $('#hilfe').classList.add('hidden');
  $('#sheet-zu').onclick = sheetZu;
  for (const id of ['#sheet', '#hilfe']) $(id).addEventListener('click', e => { if (e.target === $(id)) $(id).classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { sheetZu(); $('#hilfe').classList.add('hidden'); } });

  $('#woche-zurueck').onclick = () => { wocheVersatz--; renderWoche(); };
  $('#woche-vor').onclick = () => { if (wocheVersatz < 0) { wocheVersatz++; renderWoche(); } };

  $('#momente-liste').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (b) momentSheet(b.dataset.edit); });
  $('#btn-moment-neu').onclick = () => momentSheet(null);
  $('#korridor-von').onchange = e => { if (e.target.value) { S.einstellungen.korridorVon = e.target.value; speichern(); } };
  $('#korridor-bis').onchange = e => { if (e.target.value) { S.einstellungen.korridorBis = e.target.value; speichern(); } };
  document.querySelectorAll('#seg-balance-stil button').forEach(b => b.onclick = () => { S.einstellungen.balanceStil = b.dataset.stil; speichern(); renderVerwaltung(); });
  $('#btn-alles-loeschen').onclick = () => {
    sheet('Alle Einträge löschen', `<p class="card-text">Gezählte Momente, Feierabende und Schlaf-Einträge werden von diesem Gerät gelöscht. Die Momente selbst und die Einstellungen bleiben. Das lässt sich nicht rückgängig machen.</p>
      <div class="btn-reihe"><button class="btn-primary" id="del-ja" type="button">Einträge löschen</button><button class="btn-leise" id="del-nein" type="button">Abbrechen</button></div>`);
    $('#del-ja').onclick = () => { S.taps = []; S.feierabend = {}; S.schlaf = {}; speichern(); sheetZu(); renderAlles(); toast('Einträge gelöscht'); };
    $('#del-nein').onclick = sheetZu;
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAlles(); });
}

(async function start() {
  const gespeichert = await laden();
  if (gespeichert && gespeichert.version === 1) S = { ...startZustand(), ...gespeichert, einstellungen: { ...startZustand().einstellungen, ...gespeichert.einstellungen } };
  verbinden();
  zeige('heute');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
