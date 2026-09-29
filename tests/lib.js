// One Life test harness: shared loader.
// Loads the game into a headless browser (jsdom). Works for both the single-file build
// and a multi-file build (index.html + <script src="x.js">), by inlining each src file
// as its own <script> tag so load-order behaviour is the same as in a real browser.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM, VirtualConsole } = require('jsdom');

function readGame(entry) {
  const dir = path.dirname(entry);
  let html = fs.readFileSync(entry, 'utf8');
  html = html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (m, src) => {
    const code = fs.readFileSync(path.join(dir, src), 'utf8');
    return '<script>' + code + '</script>';
  });
  return html;
}

// Small seeded PRNG for the test driver's own choices (kept separate from the game's RNG).
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function load(entry, opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('jsdomError: ' + (e && (e.stack || e.message) || e)));
  vc.on('error', (...a) => { const s = a.map(String).join(' '); if (!/year phase/.test(s)) errors.push('console.error: ' + s); });
  const html = readGame(entry);
  const mr = mulberry(opts.mathSeed || 12345);
  const dom = new JSDOM(html, {
    url: 'https://onelife.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      win.Math.random = mr;                 // deterministic life codes
      const fixed = 1790000000000; win.Date.now = () => fixed;
      if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) win.localStorage.setItem(k, v);
      win.addEventListener('error', e => errors.push('window error: ' + (e.error && e.error.stack || e.message)));
      win.HTMLElement.prototype.scrollIntoView = function () {};
    },
  });
  const win = dom.window;
  const ev = s => win.eval(s);
  return { dom, win, ev, errors };
}

// Answer whatever modal is open, repeatedly. pickRnd chooses among enabled choices.
function drain(g, pickRnd, limit = 60) {
  let n = 0;
  // stop at death: the death screen offers 'new life', which would replace the life under test
  while (n < limit && g.ev('modalOpen()') && g.ev('S.alive')) {
    const btns = [...g.win.document.querySelectorAll('#modal button')].filter(b => !b.disabled);
    if (!btns.length) { g.ev('closeModal()'); break; }
    const choices = btns.filter(b => b.classList.contains('choice'));
    const pool = choices.length ? choices : btns;
    const b = pickRnd ? pool[Math.floor(pickRnd() * pool.length)] : pool[0];
    b.click(); n++;
  }
  return n;
}

const SHEETS = ['jobSheet', 'moneySheet', 'relSheet', 'actSheet', 'menuSheet', 'charSheet'];
// Only these get random row clicks. The menu can start a new life, which would end the test run early.
const CLICK_OK = ['jobSheet', 'relSheet', 'actSheet'];

// Open each main sheet; optionally click one random enabled row in it (light monkey test).
function poke(g, pickRnd, clickRows) {
  for (const sh of SHEETS) {
    g.ev(sh + '()');
    if (clickRows && pickRnd && CLICK_OK.includes(sh)) {
      const rows = [...g.win.document.querySelectorAll('#sheet button.row')].filter(b => !b.disabled);
      if (rows.length) rows[Math.floor(pickRnd() * rows.length)].click();
      drain(g, pickRnd);
    }
    g.ev('closeSheet()');
    drain(g, pickRnd);
  }
}

function hash(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16); }

function sanity(g) {
  const problems = [];
  const r = g.ev(`(()=>{const o={};try{o.money=S.money;o.nw=netWorth();o.age=S.age;o.alive=S.alive;
    o.stats=Object.values(S.st);o.biz=S.biz.map(b=>[b.type,b.cash,b.lastPre]);o.phaseErrs=phaseErrs.slice();}catch(e){o.err=String(e)}return JSON.stringify(o)})()`);
  const o = JSON.parse(r);
  if (o.err) problems.push('sanity read failed: ' + o.err);
  if (!Number.isFinite(o.money)) problems.push('money not finite: ' + o.money);
  if (!Number.isFinite(o.nw)) problems.push('net worth not finite: ' + o.nw);
  (o.stats || []).forEach(v => { if (!Number.isFinite(v)) problems.push('stat not finite: ' + v); });
  (o.biz || []).forEach(([t, c, p]) => { if (!Number.isFinite(c) || (p != null && !Number.isFinite(p))) problems.push(`business ${t} has bad numbers: cash ${c}, profit ${p}`); });
  (o.phaseErrs || []).forEach(e => problems.push(`phase error at age ${e.age} in ${e.phase}: ${e.msg}`));
  return { o, problems };
}

module.exports = { load, drain, poke, hash, sanity, mulberry, readGame, SHEETS };
