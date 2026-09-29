# One Life: Master Note (v6)

Lean current-state note, read at the start of every session. Working rules are in `CLAUDE.md`. Full history and detailed write-ups (sections 3.5.x, rejected designs, change log) are in `docs/ARCHIVE.md`.

---

## 1. Current state (2026-09-29)

- **Environment:** moved from a claude.ai project to Claude Code on 2026-09-29. Local folder with git. No `project_read`/`project_write` any more.
- **Build:** `One_Life.html`, about 480 KB, `SAVE_V=5`. Last feature block: 3.5.37 (social media).
- **Test reference (2026-09-29, `npm test`, 6 lives):** syntax 1 script, 0 failed, 0 em dashes. Playtest 23 runs, 0 failed, FINGERPRINT `1da74e7c2331017d`. Old saves 0 failed. Balance 0 numbers moved more than 10%. The fingerprint changes whenever code changes; that is expected.
- **Published artifact:** `https://claude.ai/artifact/J81Q77oc1qsPDd44ZeUYLs` (Version 1, has 3.5.31, `sample` capability on, published from Claude Code on 2026-09-30). The older `95FEiEA9QhTYSxeDsSbcWN` (Version 11) is stale and could not be reached from Claude Code. To update the new one, republish with `url` and keep `capabilities:{"sample":{}}`.
- **Dropped by decision (2026-09-29):** the B1/B2 brand engine and Block W wealth spec mentioned in older chat memory were never in this file. David chose to drop them and start fresh. Do not look for them.

---

## 2. Architecture in brief

- **One file, one inline script,** vanilla JS, all CSS inline, Google Fonts (Fredoka, Nunito). Mobile-first, max width 560px, light/dark via CSS variables.
- **Bottom nav:** Work (`#bJob`), Money (`#bMoney`), Age (`#bAge`), People (`#bRel`), Activities (`#bAct`). Business sits inside a Work/Business toggle with Empire/Market/Founder pills.
- **Core objects:** `S` (the save: character, stats, money, relationships, jobs, businesses, investments, flags, log; special careers in `S.act`, `S.sp`, `S.mus`, `S.mdl`, `S.inf`; listed companies in `S.tk`), `META` (cross-life: achievements, family tree, hall of fame, settings), `Q` (pending decision queue), `TICK`/`TCAP` (market tickers and sizes).
- **Year engine:** `ageUp` runs ordered `YEAR_PHASES`: tick, people, stats, prison, school, econ, stockdiv, margin, shorts, sec, college, work, pension, gig, business, angels, acting, sports, music, modeling, influencer, property, land, collect, normalise, events, history, decade, death, wrapup.
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
- **Collectibles and auctions (3.5.34):** Activities > Auction house (`aucOpen`). Six categories (`COL_CATS`), rarity from value (`colTier`), market index per category `S.cm` plus a hot category `S.cmHot`, collection `S.col`, yearly catalogue `S.auc` (three houses, `AUC_HOUSES`). Live ascending bidding against AI bidders (`aucBegin`, `aucTurn`, `aucRespond`, `aucLimit`), 12% buyer premium, 10% seller commission. Lots can be sleepers (hidden masterwork), overhyped or forged; an expert check costs 1% of the estimate. Selling: pick a house (best fit by value) and a reserve, simulated bidding war (`colSale`), or a dealer at 80%. Authentication, museum loan (fame, safe from theft), optional insurance, storage cost, theft or fire 1.2% a year, set bonus at 3 and 5 pieces. Year phase `yrCollect`. Equity is in `netWorth`, divorce, heirs, and liquidated at 70% on bankruptcy. Achievements `gavel`, `flip`, `curator`, `fullset`. Tests do not exercise it; checked with ad-hoc jsdom scripts.
- **Dating and relationships (3.5.35):** Activities > Dating (`datingSheet`) replaces Find love. Three ways to meet (app, night out, matchmaker) fill `S.pool` (this year's people); `suitor()` builds profiles with traits, job, looks, `compat` (`compatOf`), love language `ll`, quirk, secret, family `fam`, gold digger `gd`, whirlwind `wh`; orientation `S.pref`. Dates (`moveModal`, `goDate`): four date types times four approaches build `chem`; `makeOfficial` at 100. Couples: `spark` (passion) beside `rel` (trust), yearly `partnerYear` (spark decays, compat shifts drift), `coupleRows` (date night, getaway, deep talk, help out, gift, meet family), move in, prenup terms (`prenupModal`, true or 'shared'; `divorce` honours it), ring and wedding choice (`proposeFlow`, `propose2`). Secrets (`secretYear`), gold digger drain (`gdYear`). Events: anniv, tempt, pkids, pjob, cheated, bored, exret, rival, exback, triangle, gossip, gala. Achievements `bigday`, `lovebirds`. Friendships and exes-as-friends not built.
- **Sports career (3.5.36):** Activities > Careers > Sports career (`sportsSheet`, `drawSports`). Basketball, football (soccer) and tennis (`SP`). State `S.spt` (`startSport`). Team sports climb four levels by contract (youth, semi-pro, pro, big league; `SP_REQ` skill gates, `SP_AGE`); offers from scouts or a tryout (`spOffer`, `spAccept`); contracts auto-renew if ignored. Tennis is solo: rank from performance sets the level, prize money by rank, four majors a year. Yearly `yrSports`: training plan (light, normal, hard, elite coach), skill growth that flattens near the top, ageing after a sport-specific peak, injuries, season stats, championships, MVP awards, salary (agent takes 10%), endorsements (`SP_BRANDS`, slots by fame), fame into the shared `S.fame`, forced retirement at 42, hall of fame (`spRetire`), then media income until 70. Achievements `spro`, `sbig`, `schamp`, `smvp`, `sendo`, `shof`. Tested with full-career simulations (32 seasons per sport). Note: the older lines in this file about music, modeling and influencer careers describe systems that are not in the current build; only acting and now sports exist.
- **Social media (3.5.37):** Activities > Careers > Social media (`socialSheet`, `drawSocial`). State `S.soc` (`startSocial`): three platforms Snapshot, ClipTok, Chirp (`SOC_PLATS`) each with followers `f` and engagement `e`. Posting (`postFlow`, `postHow`, `postDone`, `socPostCore`): eight content types (`SOC_CONT`), quick posts free up to 6 a year, produced posts cost 1 energy; score from content fit, this year's trend, platform fit, fame, verification, manager, burnout decides viral, hit, ok or flop; gains scale with audience size with diminishing returns (`sat`). Yearly `yrSocial`: manager auto-posts, no-post penalty, organic growth, fake-follower exposure, ad revenue (`socRev`), fan subscriptions, brand deals (offers, must post twice a year), trend rotation, burnout, trolls, fame floor from following, dramas (`socCancel`, `socRival`, `socMeetup`, `socBrandCrisis`, algorithm change). Actions: collab, verification (250K), break, subscriptions, manager, buy followers (`socBuy`), promote my business, post about us (couples). Links: sports titles, Grand Slams, MVP and acting hits call `socBoost`. Achievements `sviral`, `sf100k`, `sf1m`, `sf10m`, `sver`, `scancel`. Balance checked by 26-year simulations: casual about 60K, dedicated about 500K, famous start about 1.5M.
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

**2026-09-30, 3.5.34 collectibles and auctions.** Built in one pass and tested through the real modals (every lot in all three houses, limit bids, sale, authentication, museum, save, bankruptcy). Ten-year value growth tuned to about 6% a year for a held collection (drift 2.5 to 4 percent per category, provenance growth 0.3 to 2.5 percent a year by rarity). Open question for David: land development can push cash negative through loan interest and property tax; asked how he reached the forced bankruptcy at age 25 and offered a reserve or warning. Artifact NOT republished since Version 4 (David wants to be asked first).

**2026-09-30, 3.5.35 dating and relationships.** Built after a design discussion with David (all of: spark meter, love languages, whirlwind romances, flirt moves, getaways, jealousy, love triangles, exes returning, gossip, power-couple prenups and family, quirks and secrets, orientation choice). Tested through the real modals: meeting people, dating to official, every couple action, prenup, ring, wedding, all twelve storylines, 12 years of aging with a gold digger and a secret, divorce with full and shared prenups. Not yet republished.

**2026-09-30, land cash fix.** `yrLand` now works out each development's interest and property tax first, pays it after the year's rent, and pays only what cash allows. Any shortfall is added to that development's loan with a log line, so land can no longer push cash into card debt. A yearly warning appears when cash is under 1.5 times the carrying cost, and the build financing screen shows the yearly interest and tax. Artifact not yet republished with this.

**2026-09-30, 3.5.36 sports career.** Built basketball, football (assumed soccer, asked David to confirm) and tennis as one system with a shared engine. First balance pass gave everyone skill 100 by 21 and $30M+ a year; fixed with slower growth that flattens near the top (`1.15 - skill/100`), lower starting skill, slower fame, and a smaller superstar bonus. Tennis nudged up (perf factor 0.92). Not yet republished.

**2026-09-30, 3.5.37 social media.** Full system built after David confirmed it was for the game and asked for a comprehensive version. First balance had no viral posts and 119K followers after 26 years for a heavy poster; fixed by lowering the score bands (viral 70, hit 50, ok 28), adding a follower-proportional gain with a saturation curve, and easing burnout (3 or 5 per post, minus 30 a year). Not yet republished (sports career also unpublished).
