// Balance check: year-one profit for one location in a normal economy, compared with
// the saved baseline (test/balance-baseline.json). The original master note reference is shown for context,
// but its measuring method was not recorded, so the baseline is what changes are judged against. Report only.
// Usage: node test/balance.js path/to/index.html [--seeds 20] [--write-baseline]
const { load } = require('./lib');
const args = process.argv.slice(2);
const entry = args[0] || 'One_Life.html';
const i = args.indexOf('--seeds'); const N = i >= 0 ? +args[i + 1] : 20;

// [type, label, low, high] from the master note balance table (after product system)
const REF = [
  ['truck', 'Food truck', -10000, 10000], ['cafe', 'Cafe', 11000, 34000], ['restaurant', 'Restaurant', 12000, 70000],
  ['bar', 'Bar', 95000, 125000], ['fashion', 'Clothing', 9000, 16000], ['dealership', 'Car dealership', -Infinity, 0],
  ['farm', 'Farm', 80000, 100000], ['gym', 'Gym', 85000, 93000], ['salon', 'Salon', 3000, 13500],
  ['hotel', 'Hotel', 307000, 345000], ['clinic', 'Clinic', 119000, 154000],
];
const CAFE_REF = { us: 37000, uk: 41000, my: 31000, sg: 33000, ae: 58000, ng: 5000, ch: 28000 };

const g = load(entry);
g.ev('closeModal();closeSheet();');
g.ev(`window.__yr1=function(type,seed,cityKey){
  const C=COUNTRIES[cityKey]; const city=C.cities[0]+', '+C.n;
  newLife({seed,age:30,money:400000,start:true,city,bizTypes:[type]});
  S.econ={phase:'normal',yrs:1}; S.cecon=initCecon('normal');
  const b=S.biz[0]; seedProducts(b); Q=[];
  simBiz(b); return b.lastPre; }`);
const run = (t, ck) => { const v = []; for (let s = 0; s < N; s++) v.push(g.ev(`__yr1('${t}',${700001 + s * 7717},'${ck}')`)); return v; };
const k = n => (Math.abs(n) >= 1000 ? Math.round(n / 1000) + 'k' : Math.round(n));
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

const fs = require('fs'), path = require('path');
const BASE = path.join(__dirname, 'balance-baseline.json');
const writeBase = args.includes('--write-baseline');
const base = !writeBase && fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null;
const out = {};
const pct = (a, b) => b === 0 ? 0 : (a - b) / Math.abs(b) * 100;
let drift = 0;
function report(key, label, a, extra) {
  out[key] = Math.round(a);
  let d = '';
  if (base && base[key] != null) { const p = pct(a, base[key]); d = `${p >= 0 ? '+' : ''}${p.toFixed(1)}% vs baseline ${k(base[key])}`; if (Math.abs(p) > 10) { d += '  CHANGED'; drift++; } }
  console.log(label.padEnd(18) + k(a).toString().padStart(8) + '   ' + (extra || '').padEnd(22) + d);
}
console.log(`Year-one profit, 1 location, first product auto-picked, normal economy (${N} seeds each)`);
console.log('type'.padEnd(18) + 'avg'.padStart(8) + '   original reference     change');
for (const [t, label, lo, hi] of REF) {
  const a = avg(run(t, 'us'));
  report('us:' + t, label, a, Number.isFinite(lo) ? `${k(lo)} to ${k(hi)}` : `below ${k(hi)}`);
}
console.log('\nCafe by country');
const keys = JSON.parse(g.ev('JSON.stringify(Object.keys(COUNTRIES))'));
for (const [ck, ref] of Object.entries(CAFE_REF)) {
  if (!keys.includes(ck)) continue;
  report('cafe:' + ck, '  ' + ck, avg(run('cafe', ck)), `about ${k(ref)}`);
}
if (writeBase) { fs.writeFileSync(BASE, JSON.stringify(out, null, 1)); console.log('\nbaseline written to', BASE); }
else console.log(`\nbalance: ${base ? drift + ' number(s) moved more than 10% from baseline' : 'no baseline file, run with --write-baseline'}. Report only.`);
