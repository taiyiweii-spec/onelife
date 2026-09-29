# One Life: Master Note (v6)

Lean current-state note, read at the start of every session. Working rules are in `CLAUDE.md`. Full history and detailed write-ups (sections 3.5.x, rejected designs, change log) are in `docs/ARCHIVE.md`.

---

## 1. Current state (2026-09-29)

- **Environment:** moved from a claude.ai project to Claude Code on 2026-09-29. Local folder with git. No `project_read`/`project_write` any more.
- **Build:** `One_Life.html`, about 480 KB, `SAVE_V=5`. Last feature block: 3.5.29 (small bug-fix pass).
- **Test reference (2026-09-29, `npm test`, 6 lives):** syntax 1 script, 0 failed, 0 em dashes. Playtest 23 runs, 0 failed, FINGERPRINT `1da74e7c2331017d`. Old saves 0 failed. Balance 0 numbers moved more than 10%. The fingerprint changes whenever code changes; that is expected.
- **Published artifact:** `https://claude.ai/artifact/95FEiEA9QhTYSxeDsSbcWN` (Version 11, `sample` capability on). Publishing happens in claude.ai only, see `CLAUDE.md`.
- **Dropped by decision (2026-09-29):** the B1/B2 brand engine and Block W wealth spec mentioned in older chat memory were never in this file. David chose to drop them and start fresh. Do not look for them.

---

## 2. Architecture in brief

- **One file, one inline script,** vanilla JS, all CSS inline, Google Fonts (Fredoka, Nunito). Mobile-first, max width 560px, light/dark via CSS variables.
- **Bottom nav:** Work (`#bJob`), Money (`#bMoney`), Age (`#bAge`), People (`#bRel`), Activities (`#bAct`). Business sits inside a Work/Business toggle with Empire/Market/Founder pills.
- **Core objects:** `S` (the save: character, stats, money, relationships, jobs, businesses, investments, flags, log; special careers in `S.act`, `S.sp`, `S.mus`, `S.mdl`, `S.inf`; listed companies in `S.tk`), `META` (cross-life: achievements, family tree, hall of fame, settings), `Q` (pending decision queue), `TICK`/`TCAP` (market tickers and sizes).
- **Year engine:** `ageUp` runs ordered `YEAR_PHASES`: tick, people, stats, prison, school, econ, stockdiv, margin, shorts, advisor, sec, college, work, pension, gig, business, angels, acting, sports, music, modeling, influencer, property, normalise, events, history, decade, death, wrapup.
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
- **Bug-fix pass (3.5.29):** dealership reputation death-spiral fixed (gate on quality, not reputation), dead `SEGS` and `svcStaff` removed.

---

## 4. Known issues

| Issue | Note |
|---|---|
| Lever `p` (price) modifier dead for 11 of 17 types | Naive fix broke bar, dealership, salon, hotel (their default option has a below-1 price). Pending decision, section 5. |
| `planShort` "can't afford next year's plan" prompt recurs | `autoQty`/`optPriceQty` ignore affordability. Re-test severity first. |
| Personal debt has no floor | Cash can go to minus millions. Needs a design decision. |
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

1. **Price lever fix.** (a) Re-tune `d`/`c` for every affected lever option (full rebalance, Opus); (b) apply the price effect only to non-default lever choices (contained, likely Sonnet); (c) leave dead, UI already avoids overclaiming.
2. **`planShort` throttle.** Re-test how often it fires now, then decide whether to cap auto-production at what the business can afford.
3. **Personal debt floor.** Worth a design pass now that businesses have one?

---

## 6. Backlog (priority order)

**Core loop depth**
4. Special-careers scaffold: extract shared registry, tiers, offers, yearly tick and UI from the five careers.
5. Storyline and event expansion: more per age bracket (elderly thinnest), multi-stage chains, civic and political flavor.
6. Casino and gambling: blackjack, poker, roulette, baccarat, slots, sports betting, horse racing, VIP tier, cheating with ban risk, problem-gambling arc.
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

Pick with David: one of the three pending decisions (section 5), or backlog item 4 (special-careers scaffold).

---

## 8. Recent log (keep the last few entries; older ones move to the archive)

**2026-09-29, migration to Claude Code.** Split the master note into this lean note plus `docs/ARCHIVE.md`. Added `CLAUDE.md`, `package.json`, git. Tests moved to `tests/` and `tests/fixtures/`. Fixed `run-all.sh`: failures inside a pipe were not stopping the run; it now reports PASS/FAIL per test and prints full output only on failure. Dropped B1/B2 and Block W by decision. Full suite clean, new fingerprint `1da74e7c2331017d`.
