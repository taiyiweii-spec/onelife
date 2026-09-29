// Headless play test. Plays full lives with random answers and pokes every main screen.
// Prints a fingerprint: two builds that behave identically print the same fingerprint.
// Usage: node test/playtest.js path/to/index.html [--lives 6] [--save-fixtures dir]
const fs = require('fs'), path = require('path');
const { load, drain, poke, hash, sanity, mulberry } = require('./lib');
const args = process.argv.slice(2);
const entry = args[0] || 'One_Life.html';
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIVES = +arg('--lives', 6);
const fixDir = arg('--save-fixtures', null);

let failures = 0; const prints = [];
function run(label, setup, years, seed, fixtureAt) {
  const g = load(entry, { mathSeed: seed });
  const pr = mulberry(seed * 7 + 1);
  g.ev('closeModal();closeSheet();');
  g.ev(setup);
  g.ev('render()');
  const problems = [];
  let y = 0;
  for (; y < years; y++) {
    if (!g.ev('S.alive')) break;
    try {
      g.ev('ageUp()');
      drain(g, pr);
      if (y % 7 === 3) poke(g, pr, true);
    } catch (e) { problems.push(`exception at year ${y}: ${e.stack || e}`); break; }
    const s = sanity(g); problems.push(...s.problems);
    if (fixDir && fixtureAt && fixtureAt(g, y)) {
      const body = g.ev('slotBody()'); fs.mkdirSync(fixDir, { recursive: true });
      const f = path.join(fixDir, `${label}-age${g.ev('S.age')}.json`); fs.writeFileSync(f, body); fixtureAt = null;
      console.log('  saved fixture', f, Math.round(body.length / 1024) + 'KB');
    }
    if (problems.length) break;
  }
  const saved = g.ev('save()');
  if (!saved) problems.push('save() returned false');
  problems.push(...g.errors);
  const fp = hash(g.ev('JSON.stringify(S)'));
  const sum = g.ev(`JSON.stringify({age:S.age,alive:S.alive,nw:netWorth(),biz:S.biz.length,cause:S.cause})`);
  prints.push(fp);
  if (problems.length) { failures++; console.log(`FAIL ${label}: ${sum}`); problems.slice(0, 8).forEach(p => console.log('   ', String(p).slice(0, 400))); }
  else console.log(`ok   ${label}: ${sum} fp=${fp}`);
  g.win.close();
}

// Birth lives: full lifetime from age 0.
for (let i = 0; i < LIVES; i++) {
  const seed = 200001 + i * 7919;
  run(`birth-${seed}`, `newLife({seed:${seed}})`, 120, seed,
    i === 0 ? (g, y) => g.ev('S.age') >= 30 : null);
}
// Tycoon starts: every business type, 15 years, US city.
const types = JSON.parse(load(entry).ev('JSON.stringify(Object.keys(BIZ))'));
types.forEach((t, i) => {
  const seed = 500001 + i * 104729;
  run(`tycoon-${t}`, `newLife({seed:${seed},age:25,money:400000,start:true,city:'New York, United States',bizTypes:['${t}']});S.biz.forEach(seedProducts)`, 15, seed,
    i === 0 ? (g, y) => y === 10 : null);
});
console.log(`\nplaytest: ${prints.length} runs, ${failures} failed. FINGERPRINT ${hash(prints.join(','))}`);
process.exit(failures ? 1 : 0);
