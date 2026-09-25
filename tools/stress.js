// Headless stress test: auto-play full lives (with dynasties) and report crashes, bad numbers, save size and speed.
// Usage: npm install jsdom@24 && node tools/stress.js index.html <lives> <seed>
const fs = require('fs');
const { JSDOM } = require('jsdom');
const [file, LIVES = '10', SEED = '1'] = process.argv.slice(2);
const html = fs.readFileSync(file, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/',
  beforeParse(w) {
    // seeded Math.random so runs are reproducible
    let s = (+SEED >>> 0) || 1;
    w.Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    w.AudioContext = undefined; w.webkitAudioContext = undefined;
    w.HTMLElement.prototype.scrollIntoView = () => {};
  },
});
const w = dom.window;
const errs = [];
w.addEventListener('error', e => errs.push('window error: ' + (e.error && e.error.stack || e.message)));

w.__lives = +LIVES;
const report = w.eval(`(() => {
const out = {lives: [], errors: [], nan: [], timing: [], saveSizes: [], metaSize: 0, stuck: 0, uiErrors: [], queueLeft: 0, gens: 0, bizCount: 0, maxBiz: 0};
const errKey = new Set();
function err(where, e) { const k = where + ': ' + (e && e.message); if (errKey.has(k)) return; errKey.add(k); out.errors.push({where, age: S && S.age, msg: e && e.message, stack: (e && e.stack || '').split('\\n').slice(0, 4).join(' | ')}); }
function safe(where, f) { try { return f(); } catch (e) { err(where, e); } }
function fnv(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x.toString(16); }
const enabled = ch => ch.filter(c => !(c[2] && c[2]()));
function drainQ() {
  let guard = 0;
  while (Q.length && guard++ < 50) {
    const ev = Q.shift();
    const chs = typeof ev.ch === 'function' ? ev.ch() : ev.ch;
    const ok = enabled(chs);
    if (!ok.length) { out.stuck++; continue; }
    const c = ok[Math.floor(Math.random() * ok.length)];
    safe('event "' + String(ev.text).slice(0, 50) + '" -> ' + c[0], () => { const r = c[1](); if (!ev.review) line(ev.text + ' ' + (r || '')); });
    safe('norm', () => { norm(); checkAch(); });
  }
  // modals opened by actions (choiceModal): click a random enabled button
  let g2 = 0;
  while (S.alive && modalOpen() && g2++ < 10) {
    const bs = [...document.querySelectorAll('#modal button')].filter(b => !b.disabled);
    if (!bs.length) { closeModal(); break; }
    safe('modal click', () => bs[Math.floor(Math.random() * bs.length)].click());
  }
}
function scan(label) {
  const bad = [];
  const walk = (o, p, d) => { if (d > 6 || o == null) return; if (typeof o === 'number') { if (!Number.isFinite(o)) bad.push(p); return; } if (typeof o !== 'object') return; for (const k in o) walk(o[k], p + '.' + k, d + 1); };
  walk({st: S.st, money: S.money, sloan: S.sloan, ret: S.ret, hold: S.hold, biz: S.biz, assets: S.assets, mkt: S.mkt}, 'S', 0);
  const nw = safe('netWorth', netWorth);
  if (!Number.isFinite(nw)) bad.push('netWorth()');
  bad.slice(0, 5).forEach(p => { if (out.nan.length < 30 && !out.nan.some(x => x.path === p)) out.nan.push({path: p, age: S.age, when: label}); });
}
function uiPass() {
  const sheets = [['jobSheet', jobSheet], ['moneySheet', moneySheet], ['relSheet', relSheet], ['actSheet', actSheet], ['menuSheet', menuSheet]];
  for (const [n, f] of sheets) { safe('ui ' + n, () => { f(); closeSheet(); }); }
  for (const t of ['overview', 'invest', 'biz', 'prop', 'ret']) safe('ui money tab ' + t, () => { mTab = t; moneySheet(); closeSheet(); });
  for (const b of S.biz) for (const t of ['over', 'prod', 'strat', 'grow', 'people', 'fin', 'risk']) safe('ui biz tab ' + t + ' (' + b.type + ')', () => { mTab = 'biz'; bTab = t; bizView = b.id; openSheet(drawMoney); closeSheet(); });
  mTab = 'overview'; bizView = null;
}
const TYPES = Object.keys(PCAT).filter(k => BIZ[k] && !BIZ[k].req && !HIDDEN.includes(k));
function botYear() {
  if (!canManage()) return;
  // education and job
  if (S.age === 18 && S.flags.hs && Math.random() < .6) {
    const opts = Object.keys(MAJORS).filter(m => !MAJORS[m].grad && S.st.smarts >= MAJORS[m].sm);
    if (opts.length) { S.edu.major = opts[Math.floor(Math.random() * opts.length)]; S.edu.yrs = 0; }
  }
  if (!S.job && !S.edu.major && !S.retired && S.age < 62) {
    const ok = Object.keys(CAREERS).filter(id => { const C = CAREERS[id]; return (!C.deg || S.edu.degrees.includes(C.deg)) && S.st.smarts >= reqSm(C, 0) && (!C.clean || !S.flags.record) && (!C.car || hasCar()); });
    if (ok.length) safe('hire', () => hire(ok[Math.floor(Math.random() * ok.length)]));
  }
  if (S.job && S.age >= 65 && !S.retired) { S.retired = true; S.job = null; }
  // love and family
  if (!partner() && S.age >= 20 && S.age < 50 && Math.random() < .4) { safe('findLove', findLove); drainQ(); }
  const p = partner();
  if (p && p.type === 'Partner' && p.rel > 60 && Math.random() < .3) { p.type = 'Spouse'; }
  if (spouse() && kids().length < 3 && S.age < 42 && Math.random() < .3) { const k = person('Child', Math.random() < .5 ? 'M' : 'F', 0, lastName()); k.rel = 90; S.rels.push(k); }
  // money
  if (S.money > 20000 && Math.random() < .5) { const a = Math.round(S.money * .2); S.money -= a; S.hold.MKT = (S.hold.MKT || 0) + a / S.mkt.MKT.p; S.basis.MKT = (S.basis.MKT || 0) + a; }
  if (S.job && !S.ret.pct) S.ret.pct = 5;
  if (!homes().length && S.age >= 25) { const it = SHOP.find(x => x.k === 'home'); const pr = Math.round(it.p * S.homeIdx); if (S.money > pr * 1.05) { S.money -= pr; S.assets.push({n: it.n, v: pr, k: 'home', rent: false, mort: null}); } }
  // business
  if (S.age >= 24 && S.age < 60 && S.biz.length < 3 && Math.random() < .25) {
    const k = TYPES[Math.floor(Math.random() * TYPES.length)], T = BIZ[k];
    if (S.money > T.cost * .5) safe('launch ' + k, () => {
      const mine = Math.min(S.money, T.cost); const loan = Math.max(0, T.cost - mine); const setup = Math.round(T.cost * (1 - T.cap));
      S.money -= mine;
      const b = newBiz(k, pick(T.names), {own: 1, inv: 0, rep: 50, cash: T.cost - setup});
      seedProducts(b); syncStaff(b);
      if (loan) addLoan(b, loan);
      S.biz.push(b); S.flags.founded = (S.flags.founded || 0) + 1; out.bizCount++;
      if (Math.random() < .5 && !S.job && !S.edu.major) b.life = 'hands';
    });
  }
  out.maxBiz = Math.max(out.maxBiz, S.biz.length);
  // random activities from the Activities sheet (tap random enabled rows)
  safe('actSheet', () => { actSheet(); });
  for (let i = 0; i < 2; i++) {
    const rows = [...document.querySelectorAll('#sheet button.row')].filter(b => !b.disabled && !/crime|burglar|steal|rob|casino|murder/i.test(b.textContent));
    if (!rows.length) break;
    const pickRow = rows[Math.floor(Math.random() * rows.length)]; safe('activity: ' + pickRow.textContent.slice(0, 30), () => pickRow.click());
    drainQ();
    if (!document.getElementById('sheetWrap').classList.contains('open')) break;
  }
  safe('closeSheet', closeSheet);
}
let lives = 0, years = 0, t0 = performance.now();
safe('newLife', () => newLife());
while (lives < window.__lives) {
  const start = {name: S.name, gen: S.gen};
  let life = {gen: S.gen, start: S.age};
  let yrGuard = 0;
  while (S.alive && yrGuard++ < 130) {
    safe('botYear', botYear); drainQ();
    const a = performance.now();
    safe("ageUp", () => ageUp(true));
    out.timing.push(performance.now() - a);
    years++;
    drainQ();
    scan('after ageUp');
    if (S.age % 10 === 0) safe('uiPass', uiPass);
    if (S.age % 5 === 0) out.saveSizes.push(JSON.stringify(S).length);
    safe('save', save);
    const re = readSlot(curSlot); if (!re || re.age !== S.age) err('save roundtrip', new Error('save did not round-trip at age ' + S.age));
  }
  out.fp = fnv((out.fp || '') + JSON.stringify(S));
  out.queueLeft += Q.length;
  closeModal();
  life.death = S.age; life.cause = S.cause; life.nw = safe('nw', netWorth); life.biz = S.biz.map(b => b.type + ':' + Math.round(b.cash)); life.kids = kids().filter(k => k.alive).length;
  out.lives.push(life); lives++;
  if (S.alive) { err('life loop', new Error('life did not end in 130 years')); }
  safe('showDeath', showDeath); closeModal();
  const ks = kids().filter(k => k.alive);
  if (ks.length && S.gen < 6) { safe('continueAs', () => continueAs(ks[0])); out.gens = Math.max(out.gens, S.gen); }
  else safe('newLife', () => newLife());
  drainQ();
}
out.years = years; out.totalMs = Math.round(performance.now() - t0);
out.metaSize = JSON.stringify(META).length;
out.phaseErrs = phaseErrs.slice(0, 20); out.phaseErrCount = phaseErrs.length;
return out;
})()`);

const t = report.timing.sort((a, b) => a - b);
const q = p => t[Math.floor(t.length * p)].toFixed(2);
console.log(JSON.stringify({
  fingerprint: report.fp, lives: report.lives.length, years: report.years, totalMs: report.totalMs, maxGen: report.gens, bizLaunched: report.bizCount, maxBizAtOnce: report.maxBiz,
  ageUpMs: {p50: q(.5), p95: q(.95), max: t[t.length - 1].toFixed(2)},
  saveBytes: {max: Math.max(...report.saveSizes), avg: Math.round(report.saveSizes.reduce((a, b) => a + b, 0) / report.saveSizes.length)},
  metaBytes: report.metaSize, stuckEvents: report.stuck, queueLeftAtDeath: report.queueLeft,
  deaths: report.lives.map(l => `g${l.gen}:${l.start}->${l.death} ${l.cause} nw=${Math.round(l.nw)}`),
}, null, 1));
console.log('ERRORS', report.errors.length); report.errors.forEach(e => console.log(' -', e.where, '| age', e.age, '|', e.msg, '|', e.stack));
console.log('YEAR STEP ERRORS', report.phaseErrCount); report.phaseErrs.forEach(e => console.log(' -', e.phase, '| age', e.age, '|', e.msg));
console.log('BAD NUMBERS', report.nan.length); report.nan.forEach(n => console.log(' -', n.path, 'age', n.age));
errs.slice(0, 10).forEach(e => console.log(e));
process.exit(0);
