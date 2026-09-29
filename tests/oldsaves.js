// Old-save test. Every saved life must still load and keep playing.
// Covers: saves from this build and older builds (test/fixtures/*.json), the legacy
// single-slot v3 format, and the "decision left open when the game was closed" replay.
// Usage: node test/oldsaves.js path/to/index.html
const fs = require('fs'), path = require('path');
const { load, drain, sanity, mulberry } = require('./lib');
const entry = process.argv[2] || 'One_Life.html';
const fixDir = path.join(__dirname, 'fixtures');
let fails = 0;

function check(label, storage, expect) {
  const g = load(entry, { storage, mathSeed: 99 });
  const pr = mulberry(4242);
  const problems = [];
  const got = JSON.parse(g.ev('JSON.stringify(S?{name:S.name,age:S.age,v:S.v,alive:S.alive}:null)'));
  if (!got) problems.push('no life loaded');
  else {
    if (expect.name && got.name !== expect.name) problems.push(`loaded ${got.name}, expected ${expect.name}`);
    if (expect.age != null && got.age !== expect.age) problems.push(`loaded age ${got.age}, expected ${expect.age}`);
    if (got.v !== g.ev('SAVE_V')) problems.push(`save version ${got.v} not migrated to ${g.ev('SAVE_V')}`);
    drain(g, pr);
    for (let i = 0; i < 5 && g.ev('S.alive'); i++) { try { g.ev('ageUp()'); drain(g, pr); } catch (e) { problems.push('ageUp threw: ' + e.message); break; } }
    problems.push(...sanity(g).problems);
    if (!g.ev('save()')) problems.push('save() failed after loading');
    // round trip: what we just saved must load again
    const body = g.ev('slotBody()');
    const g2 = load(entry, { storage: { 'onelife-slot-1': body, 'onelife-cur': '1' } });
    if (g2.ev('S?S.name:null') !== g.ev('S.name')) problems.push('round-trip reload lost the life');
    g2.win.close();
  }
  problems.push(...g.errors);
  g.win.close();
  if (problems.length) { fails++; console.log(`FAIL ${label}`); problems.slice(0, 6).forEach(p => console.log('   ', String(p).slice(0, 300))); }
  else console.log(`ok   ${label}: ${got.name}, age ${got.age}`);
}

// 1. Saved fixtures (this build and older builds)
for (const f of fs.readdirSync(fixDir).filter(f => f.endsWith('.json'))) {
  const body = fs.readFileSync(path.join(fixDir, f), 'utf8');
  const d = JSON.parse(body);
  check(`fixture ${f}`, { 'onelife-slot-1': body, 'onelife-cur': '1' }, { name: d.S.name, age: d.pending ? undefined : d.S.age });
}

// 2. Legacy v3 single-slot save, built by stripping a fixture back to the old shape
{
  const d = JSON.parse(fs.readFileSync(path.join(fixDir, 'birth-200001-age30.json'), 'utf8'));
  const s = d.S;
  ['fame', 'rivals', 'forSale', 'mentees', 'trend', 'regs', 'supIdx', 'holding', 'exes', 'chal', 'qs', 'karma', 'ethic', 'sk', 'born',
    'miles', 'nwHist', 'mem', 'seen', 'cecon', 'act', 'bubble', 'shorts', 'margin', 'ipoIdx', 'advisor', 'secWatch'].forEach(k => delete s[k]);
  s.v = 3;
  check('legacy v3 save (old key)', { 'onelife-save-v3': JSON.stringify(s), 'onelife-meta': JSON.stringify({ ach: {}, tree: [] }) }, { name: s.name, age: s.age });
}

// 3. Game closed while a decision was on screen: the year should replay
{
  const g = load(entry, { mathSeed: 7 });
  g.ev('closeModal();closeSheet();newLife({seed:310001});render()');
  let body = null, age = null;
  for (let i = 0; i < 60 && !body; i++) {
    g.ev('ageUp()');
    if (g.ev('modalOpen()') && g.ev('Q.length>0||modalOpen()')) { g.ev('save()'); const b = g.ev('slotBody()'); if (JSON.parse(b).pending) { body = b; age = g.ev('S.age'); } }
    drain(g, mulberry(i));
  }
  g.win.close();
  if (!body) { console.log('skip pending-decision replay: no open decision with a queue found'); }
  else check('pending decision replays the year', { 'onelife-slot-1': body, 'onelife-cur': '1' }, { age: age - 1 });
}

// 4. Net worth must survive a save and reload, including companies that listed during the life,
//    and saves made before listed companies were saved (no S.tk).
{
  const g = load(entry, { mathSeed: 5 }); const pr = mulberry(9);
  g.ev('closeModal();closeSheet();newLife({seed:400001,age:18,money:2000000,start:true,city:"New York, United States"});render()');
  for (let y = 0; y < 30; y++) { g.ev('ageUp()'); drain(g, pr);
    g.ev('TICK.slice(BASE_TICK_LEN).forEach(t=>{if(!S.hold[t.s]){S.hold[t.s]=100;S.basis[t.s]=100*price(t.s);}})'); }
  g.ev('save()');
  const nw = g.ev('netWorth()'), dyn = g.ev('TICK.length-BASE_TICK_LEN'), body = g.ev('slotBody()');
  g.win.close();
  const reload = (b, label, exact) => {
    const g2 = load(entry, { storage: { 'onelife-slot-1': b, 'onelife-cur': '1' } });
    const nw2 = g2.ev('netWorth()'), lost = g2.ev('Object.keys(S.hold).filter(k=>S.hold[k]>0&&!TICK.some(t=>t.s===k)).length');
    const ok = lost === 0 && (exact ? Math.abs(nw2 - nw) < 1 : Math.abs(nw2 - nw) / Math.max(1, Math.abs(nw)) < 0.001) && !g2.errors.length;
    if (!ok) { fails++; console.log(`FAIL ${label}: net worth ${nw} became ${nw2}, ${lost} holdings missing`, g2.errors.slice(0, 2)); }
    else console.log(`ok   ${label}: ${dyn} listed companies kept, net worth ${Math.round(nw2)}`);
    g2.win.close();
  };
  if (dyn < 1) { fails++; console.log('FAIL reload test: no company listed during the life, test needs a longer run'); }
  reload(body, 'reload keeps listed companies', true);
  const d = JSON.parse(body); delete d.S.tk;
  reload(JSON.stringify(d), 'pre-fix save recovers listed companies', false);
}

console.log(`\noldsaves: ${fails} failed.`);
process.exit(fails ? 1 : 0);
