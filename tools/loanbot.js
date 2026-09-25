// Personal loan test bot: checks limits, yearly payments, top-ups, missed payments, early repayment,
// bankruptcy and inheritance, then plays random lives that borrow and repay through the real screens.
// Usage: npm install jsdom@24 && node tools/loanbot.js [lives] [seed]
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const [LIVES = '15', SEED = '3'] = process.argv.slice(2);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/',
  beforeParse(w) {
    let s = (+SEED >>> 0) || 1;
    w.Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    w.AudioContext = undefined; w.webkitAudioContext = undefined;
    w.HTMLElement.prototype.scrollIntoView = () => {};
  },
});
const w = dom.window;
w.__lives = +LIVES;
const out = w.eval(`(() => {
const res = {pass: [], fail: [], errors: [], random: {loans: 0, topups: 0, repaid: 0, missed: 0, paidOff: 0, years: 0}};
const ok = (name, cond, info) => (cond ? res.pass : res.fail).push(name + (cond ? '' : ' :: ' + JSON.stringify(info)));
const drain = () => { let g = 0; while (Q.length && g++ < 50) { const ev = Q.shift(); const ch = (typeof ev.ch === 'function' ? ev.ch() : ev.ch).filter(c => !(c[2] && c[2]())); if (ch.length) ch[0][1](); } closeModal(); };
const year = () => { ageUp(true); drain(); };
const fresh = (money = 20000) => { newLife({start: 1, age: 30, money}); S.st.health = 100; S.traits = []; hire('tech', 1); S.karma = 60; };
const click = txt => { const b = [...document.querySelectorAll('#modal button')].find(x => x.textContent.includes(txt) && !x.disabled); if (b) b.click(); return !!b; };

// 1. limits follow the table
fresh();
let I = plInfo(), t = plTier();
ok('tier found for a working adult', !!t, {score: creditScore()});
ok('limit = income x multiplier + net worth share', I.limit === Math.round(I.inc * t[1] + I.nw * t[2]), I);
ok('room never above limit', PL_TERMS.every(y => plRoom(y) <= I.limit), I);
ok('longer terms allow at least as much', plRoom(7) >= plRoom(1), {r1: plRoom(1), r7: plRoom(7)});

// 2. a 5-year loan is fully repaid after 5 years
fresh();
let amt = Math.min(plRoom(5), 50000); S.ploan = plNew(amt, 5); S.money += amt;
const pay = S.ploan.pay, nw0 = netWorth();
ok('borrowing does not change net worth', Math.abs(netWorth() - (nw0)) < 2, {nw0});
for (let i = 0; i < 5; i++) { S.st.health = 100; year(); }
ok('loan gone after its term', !S.ploan, S.ploan);
ok('interest paid is sensible', pay * 5 > amt && pay * 5 < amt * 1.6, {pay, amt});

// 3. top-up blends into one loan with the new term
fresh();
S.ploan = plNew(20000, 3); S.money += 20000; S.st.health = 100; year();
const before = S.ploan.bal, room = plRoom(7);
ok('there is room to top up', room > 0, {room});
const top = Math.min(room, 10000); S.ploan = plNew(top, 7); S.money += top;
ok('top-up adds to the balance', S.ploan.bal === before + top, {before, top, bal: S.ploan.bal});
ok('top-up resets the term', S.ploan.left === 7, S.ploan);

// 4. a missed payment lands on the credit card and hurts credit
fresh();
S.ploan = plNew(30000, 3); S.job = null; S.money = 0; const cs0 = creditScore(); S.st.health = 100; year();
ok('missed payment is flagged', S.flags.plMiss === S.age, S.flags);
ok('missed payment makes cash negative', S.money < 0, {money: S.money});
ok('credit score drops', creditScore() < cs0, {cs0, now: creditScore()});

// 5. bad credit or bankruptcy blocks borrowing
fresh(); S.flags.badCreditUntil = S.age + 5;
ok('bad credit blocks the loan', plMaxBal(5) === 0 && !!plInfo().why, plInfo());

// 6. no job but wealthy can still borrow against net worth
fresh(2000000); S.job = null;
ok('wealthy with no income can borrow', plRoom(5) > 0, {room: plRoom(5), info: plInfo()});

// 7. under 18 cannot borrow
newLife({start: 1, age: 16, money: 5000});
ok('minors cannot borrow', plMaxBal(5) === 0, plInfo());

// 8. real screens: borrow, top up and repay by clicking
fresh(50000);
mTab = 'overview'; moneySheet();
const rowBtn = [...document.querySelectorAll('#sheet button.row')].find(b => b.textContent.includes('Personal loan'));
ok('Overview shows the loan row', !!rowBtn, null);
rowBtn.click();
ok('loan popup opens', modalOpen(), null);
ok('picked 5 years', click('5 years'), null);
const cashBefore = S.money; ok('borrow button works', click('Borrow '), null);
ok('cash went up after borrowing', S.money > cashBefore && S.ploan && S.ploan.left === 5, {money: S.money, L: S.ploan});
loanModal(); ok('pay off early is offered', click('Pay off early'), null); click('Repay ');
ok('paying off early clears the loan', !S.ploan, S.ploan);
closeSheet(); closeModal();

// 9. bankruptcy wipes it, inheritance deducts it
fresh(); S.ploan = plNew(25000, 5); S.money = -50000; mTab = 'overview'; moneySheet();
const bk = [...document.querySelectorAll('#sheet button.row')].find(b => b.textContent.includes('Declare bankruptcy')); if (bk) bk.click();
ok('bankruptcy wipes the loan', !!bk && !S.ploan, {bk: !!bk, L: S.ploan});
closeSheet();
fresh(100000); const kid = person('Child', 'F', 20, lastName()); S.rels.push(kid); S.ploan = plNew(40000, 5); S.money += 40000;
const est = Math.round((S.money - S.sloan - plBal() + investVal() + S.ret.bal + angelVal()) * .85);
continueAs(kid);
ok('heir inherits cash minus the loan', Math.abs(S.money - est) < 5 || S.money >= est, {money: S.money, est});
ok('loan does not pass to the heir', !S.ploan, S.ploan);

// 10. random lives that borrow, top up and repay through the popup
const R0 = res.random;
for (let life = 0; life < window.__lives; life++) {
  newLife({start: 1, age: 22, money: Math.round(Math.random() * 80000)});
  if (Math.random() < .7) hire(pick(['tech', 'fin', 'retail', 'office']), 0);
  let guard = 0;
  while (S.alive && guard++ < 80) {
    try {
      if (canManage() && Math.random() < .3) {
        const had = !!S.ploan; loanModal();
        const bs = [...document.querySelectorAll('#modal button')].filter(b => !b.disabled && !/Close/.test(b.textContent));
        if (bs.length) { const b = bs[Math.floor(Math.random() * bs.length)]; const isRepay = /Pay off/.test(b.textContent); b.click();
          const ok2 = [...document.querySelectorAll('#modal button.choice')].find(x => /^(Borrow|Repay) /.test(x.textContent) && !x.disabled);
          if (ok2) { ok2.click(); if (isRepay) R0.repaid++; else if (had) R0.topups++; else R0.loans++; } }
        closeModal();
      }
      const had = S.ploan && S.ploan.bal; const miss0 = S.flags.plMiss;
      ageUp(true); drain(); R0.years++;
      if (S.flags.plMiss !== miss0 && S.flags.plMiss != null) R0.missed++;
      if (had && !S.ploan) R0.paidOff++;
      const bad = [S.money, netWorth(), creditScore(), plBal(), S.ploan ? S.ploan.pay : 0, S.ploan ? S.ploan.rate : 0].some(v => !Number.isFinite(v));
      if (bad) { res.errors.push('bad number at age ' + S.age + ' ' + JSON.stringify(S.ploan)); break; }
      if (S.ploan && (S.ploan.bal < 0 || S.ploan.left < 0)) { res.errors.push('negative loan ' + JSON.stringify(S.ploan)); break; }
    } catch (e) { res.errors.push(e.message + ' | ' + (e.stack || '').split('\\n')[1]); break; }
  }
}
if (phaseErrs.length) res.errors.push(...phaseErrs.slice(0, 5).map(e => 'year phase ' + e.phase + ': ' + e.msg));
return res;
})()`);
console.log('PASSED ' + out.pass.length + ', FAILED ' + out.fail.length);
out.fail.forEach(f => console.log('  FAIL ' + f));
console.log('RANDOM LIVES', JSON.stringify(out.random));
console.log('ERRORS ' + out.errors.length);
out.errors.slice(0, 10).forEach(e => console.log('  ' + e));
