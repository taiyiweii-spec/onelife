# One Life: Master Note (v6)

Lean current-state note, read at the start of every session. Working rules are in `CLAUDE.md`. Full history and detailed write-ups (sections 3.5.x, rejected designs, change log) are in `docs/ARCHIVE.md`.

---

## 1. Current state (2026-09-29)

- **Environment:** moved from a claude.ai project to Claude Code on 2026-09-29. Local folder with git. No `project_read`/`project_write` any more.
- **Build:** `One_Life.html`, about 480 KB, `SAVE_V=5`. Last feature block: 3.5.33 (casino: blackjack and poker).
- **Test reference (2026-09-29, `npm test`, 6 lives):** syntax 1 script, 0 failed, 0 em dashes. Playtest 23 runs, 0 failed, FINGERPRINT `1da74e7c2331017d`. Old saves 0 failed. Balance 0 numbers moved more than 10%. The fingerprint changes whenever code changes; that is expected.
- **Published artifact:** `https://claude.ai/artifact/J81Q77oc1qsPDd44ZeUYLs` (Version 1, has 3.5.31, `sample` capability on, published from Claude Code on 2026-09-30). The older `95FEiEA9QhTYSxeDsSbcWN` (Version 11) is stale and could not be reached from Claude Code. To update the new one, republish with `url` and keep `capabilities:{"sample":{}}`.
- **Dropped by decision (2026-09-29):** the B1/B2 brand engine and Block W wealth spec mentioned in older chat memory were never in this file. David chose to drop them and start fresh. Do not look for them.

---

## 2. Architecture in brief

- **One file, one inline script,** vanilla JS, all CSS inline, Google Fonts (Fredoka, Nunito). Mobile-first, max width 560px, light/dark via CSS variables.
- **Bottom nav:** Work (`#bJob`), Money (`#bMoney`), Age (`#bAge`), People (`#bRel`), Activities (`#bAct`). Business sits inside a Work/Business toggle with Empire/Market/Founder pills.
- **Core objects:** `S` (the save: character, stats, money, relationships, jobs, businesses, investments, flags, log; special careers in `S.act`, `S.sp`, `S.mus`, `S.mdl`, `S.inf`; listed companies in `S.tk`), `META` (cross-life: achievements, family tree, hall of fame, settings), `Q` (pending decision queue), `TICK`/`TCAP` (market tickers and sizes).
- **Year engine:** `ageUp` runs ordered `YEAR_PHASES`: tick, people, stats, prison, school, econ, stockdiv, margin, shorts, sec, college, work, pension, gig, business, angels, acting, sports, music, modeling, influencer, property, land, normalise, events, history, decade, death, wrapup.
- **Saves:** `localStorage` per device plus export/import backup codes. New fields are additive defaults in `fillDefaults`, so old saves load without a version bump. Staying client-side, no server.
- **AI features** (storyteller, obituary, investor pitch, AI Assistant) use `window.claude.use('sample')` and only work inside the claude.ai artifact.

---

## 3. Systems built (one line each; detail in archive under the 3.5.x number)

- **World:** 16 countries, 30 base tickers plus IPO pool, bankruptcy, splits, bubbles, mergers.
- **Life:** stats, 14 traits, fame, 19 full-time careers, 5 part-time jobs, 9 majors. Special careers: acting, sports, singer, model, influencer (five parallel code blocks, not yet unified).
- **Money:** personal finance, property, deep investing.
- **Business, 17 types:** 7 goods (`truck, cafe, restaurant, bar, farm, fashion, dealership`), 4 services (gym, salon, hotel, clinic), 6 abstract-revenue (realty, tech, music/label, construction, gaming, lawfirm). Supply chain, governance, holding company.
- **Staffing (3.5.6, 3.5.28):** hard hiring cap `needStaff(b)`; `staffFactor` caps capacity for all 11 goods/services types, 20% floor. Auto-hire keeps it at 1 by default.
- **Plan editor (3.5.7, 3.5.13):** slider capped to business cash; auto-production nets out leftover stock.
- **New businesses start hands-on (3.5.8);** CEO candidates shown only on request (3.5.10).
- **Finance tab (3.5.9, 3.5.12):** live current overhead; projected gross profit and cash flow.
- **Strategy tab (3.5.14, 3.5.19):** lever effect lines; Growth folded in. Tycoon tabs: Overview, Products, Strategy, People, Finance, Risk.
- **Supplier offers biased by reputation (3.5.15).** Product rows show gross profit and margin (3.5.17).
- **Undo** complete, including from the death screen (3.5.18). **AI Assistant** chat (3.5.20).
- **City expansion (3.5.21):** `effLocs` spreads outlets over `b.cities`, capped by `CITY_CAP`.
- **Marketing funnel (3.5.23, 3.5.24, 3.5.26):** persistent customers `b.cust`, churn, 11 channels (`CH`), followers, national awareness, social media manager, e-commerce as outlet-equivalent distribution (`distLocs = effLocs + ecCap`), 6 online route types, own P&L lines.
- **Buildings buy/sell slider (3.5.25).**
- **Credit line (3.5.27):** draws capped at the limit, 10% within and 18% over the limit, automatic repayment keeping a cash buffer.
- **Price lever (3.5.30):** for goods types, `p` applies only to non-default lever options (`levP` in `prodMult`); services unchanged.
- **Card debt limit (3.5.31):** negative cash is card debt at 7%; past `cardLimit()` (larger of $100,000 or 5x yearly income) the lenders force `fileBankruptcy()`, the same routine as the manual button.
- **Land development (3.5.32):** Money > Market > Land. `S.dev` holds parcels through `land`, `rezone`, `build`, `done`. Buy land (2% closing), rezone non-commercial land (5% of value, decided at year end, `rezoneP()`), build warehouse, retail, office or mixed-use (`DEV_TYPES`, cash or 70% loan, 1 to 3 years, up to 25% overrun, 12% delay chance), lease up over about 3 years (`devTgt` by economy and area), sell (6% land fees, 3% built). Construction firm cuts build cost 12% and overruns 50%; Realty agency adds 4% occupancy and cuts sale fees. Equity is in `netWorth`, bankruptcy, divorce and heirs. Achievements `devbuilt`, `devgain`. Tests do not build anything; checked with ad-hoc jsdom scripts.
- **Casino (3.5.33):** Activities > Casino (1 energy a visit) opens `casinoSheet`. Blackjack (`blackjack`, `bjDeal`; infinite deck, dealer stands on 17, 3:2 blackjack, hit, stand, double; no split or insurance). No-limit Texas Hold'em against 1, 3 or 5 AI players (`poker`, `pkBlinds`, `pkHand`, `pkStep`, `pkAI`, `pkHuman`, `pkRaise`; chosen blinds, blinds rotate, bet, raise to any amount, call, fold, all in; everyone starts each hand with my cash as their stack so there are no side pots; 5% rake once the flop is dealt, capped at 10 big blinds; `pokerScore` best 5 of 7; `pokerStrengthN` AI with tight and aggressive traits; a read on the last aggressor for smarts 60+). The AI playing my seat loses about 0.1 to 0.15 big blinds a hand, roughly its rake share. `amountModal` now takes an optional `onCancel`. Slots (`slots`, `slotSpin`, `slotRoll`): pick a bet, three reels, 92% return (sevens 50x, diamonds 10x, bells 4x, lemons 2x, two cherries push); Lucky trait gives a 6% free re-roll on a loss. Results tracked in `CV.net`, `S.used.gnet`, `S.flags.gTot`; achievement `highroller`. Backlog 6 still open: roulette, baccarat, sports betting, horse racing, VIP tier, cheating, problem-gambling arc.
- **Bug-fix pass (3.5.29):** dealership reputation death-spiral fixed (gate on quality, not reputation), dead `SEGS` and `svcStaff` removed.

---

## 4. Known issues

| Issue | Note |
|---|---|
| Understaffing hits twice | Hard capacity cap plus the soft demand `ratio` in `simBiz`. Deliberate; flag if it plays badly. |
| Angel-startup IPO path is dead code | Always pays out as an acquisition. |
| Saves hold a full copy of last year (undo) | Saves about twice the needed size. |
| Dynasty handover drops listed companies | Existing behaviour. |
| No inflation or calendar year | Prices never change over a lifetime. |
| Rivals are a strength number | Shallow competition; market competition is zero-sum. |
| Take-private conversion size is capped | Large companies convert to the same-sized business. |
| No work-hour cap / overstress | Backlog 6b. |
| Special careers not unified; four newest have no achievements | Backlog 4 and 24. |
| Simple-mode businesses keep a standalone Growth tab | Inconsistent with tycoon mode. |
| Quantity bulk discount rejected twice by balance | Needs a different approach if revisited. |
| No per-product "sold online" readout | Data exists in `pr.last.on`/`pr.last.ret`. Not requested yet. |
| Balance reference method unknown | Judge against `tests/balance-baseline.json`, not the original table. |

---

## 5. Pending decisions

None open. (`planShort` throttle closed 2026-09-29: re-test showed 9 prompts in 255 business-years, at most 3 in one 15-year run, so no throttle needed.)

---

## 6. Backlog (priority order)

**Core loop depth**
4. Special-careers scaffold: extract shared registry, tiers, offers, yearly tick and UI from the five careers.
5. Storyline and event expansion: more per age bracket (elderly thinnest), multi-stage chains, civic and political flavor.
6. Casino and gambling, remaining: roulette, baccarat, sports betting, horse racing, VIP tier, cheating with ban risk, problem-gambling arc. (Blackjack, poker and slots done in 3.5.33.)
6b. Work-hour cap / overstress mechanic. Not yet designed.

**Business depth**
- Option B: depth pass for the 6 abstract-revenue types (Opus).
- Option C: per-industry flavor content (Sonnet).
- Geography follow-ups: per-city population, picking a city on a map, international expansion tier, rivals with real geography.

**Special careers**
8. Politician (factions, elections, corruption) and Crimelord (heat, rival gangs, crew, jail).

**Life-sim roundness**
9. Dating pool. 10. Friendships. 11. Divorce, custody, alimony. 12. Insurance and estate planning. 13. Social class as a visible stat. 14. Mental health and addiction.

**World and assets**
15. More countries. 16. Military service. 17. World news feed. 18. Vehicles beyond cars. 19. Collectibles as investments. 20. Charity and philanthropy.

**Late life**
21. Retirement lifestyle. 22. Funeral planning. 23. Language and culture friction abroad.

**Ongoing / future**
24. Achievements for every new system (sports, singer, model, influencer have none). 25. Cross-device sync.

**Out of scope for now:** weather and climate, deep country mechanics.

---

## 7. Next step

Pick with David: backlog item 4 (special-careers scaffold).

---

## 8. Recent log (keep the last few entries; older ones move to the archive)

**2026-09-29, migration to Claude Code.** Split the master note into this lean note plus `docs/ARCHIVE.md`. Added `CLAUDE.md`, `package.json`, git. Tests moved to `tests/` and `tests/fixtures/`. Fixed `run-all.sh`: failures inside a pipe were not stopping the run; it now reports PASS/FAIL per test and prints full output only on failure. Dropped B1/B2 and Block W by decision. Full suite clean, new fingerprint `1da74e7c2331017d`.

**2026-09-29, 3.5.30 price lever.** Goods types (restaurant, bar, farm, dealership) now honour lever `p` for non-default options via `levP`; `levText` shows the price line for them. Default options and the 4 service types unchanged. Balance 0 moved, so no re-baseline. Fingerprint unchanged (1da74e7c2331017d): the playtest never picks a non-default lever.

**2026-09-29, 3.5.31 card debt limit.** Added `cardLimit()` and `fileBankruptcy()` (extracted from the manual button). Year-end forced bankruptcy when card debt passes the limit; Money tab text shows the limit. Phoenix start (-$60,000) stays under it. Not covered by tests (no playtest run reaches it).

**2026-09-29, planShort re-test.** Counted prompts across all 17 business types over 15 years each: 9 prompts in 255 business-years. Not a recurring nuisance, so no code change. Issue and pending decision removed.

**2026-09-30, 3.5.32 land development.** Designed and built in one pass (`yrLand` phase, `landList`, `devModal`, `devPlan`, `startBuild`, `sellDev`). Rents and recession swings tuned so a build is worth about 10 to 17% over cost in a normal economy, less after overruns and interest. Not balanced against long play; watch leverage: 70% loans at about 8% roughly cancel the rent while a building is filling. Playtest fingerprint changed (expected).

**2026-09-30, investment advisor removed.** The Investing dashboard section, `ADVISORS` and the `advisor` year phase are gone. `fillDefaults` clears `s.advisor` so old saves stop paying the fee.

**2026-09-30, 3.5.33 casino.** Added blackjack and Texas Hold'em to a new casino sheet. Checked with ad-hoc jsdom scripts: hand ranking cases, about 1,600 blackjack hands and 1,450 poker hands through the real modals, money reconciles to the visit result. Poker AI is simple and not balanced against strong human play. Fingerprint changed (expected).

**2026-09-30, poker rebuilt.** Player-chosen bet, raise, call, fold and all in, at tables of 2, 4 or 6. Tested with scripted bots through the real modals (money reconciles, cancel from the raise screen returns to the action screen) and with the AI playing my seat for 4,000 hands at each table size.

**2026-09-30, slots.** Slots now ask for a bet and show reels. First version had a bug where Lucky shifted the roll and shut off the top payouts (measured 51% return); fixed and re-measured over 30,000 spins at about 93%. Publishing rule from David: ask before republishing the artifact.
