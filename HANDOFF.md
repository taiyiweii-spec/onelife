# One Life: Handoff

Read this first, then `docs/MASTER_NOTE.md` for the full game design.

## Base switched (25 September 2026)
`index.html` is now the newer 300 KB version, taken from the published artifact https://claude.ai/artifact/RLG41cydbEafzToL4TuZ1T (owned by the user). It has the Phase 1 and 2 features the master note called lost: 16 countries and taxes, moving abroad, board governance, dividends, 4 banks, wholesale, factories, cash flow. It also has 3 save slots, backup codes, an unfinished decision coming back on load, Undo year, karma, and a character creator (name, gender, country, stat sliders).
It does NOT have the replay dice, the `YEAR_STEPS` list or the 3-card character picker from the older base (those are in git history before this commit). It uses `Math.random()` directly and its yearly routine is `YEAR_PHASES`. Sections below that describe the older base are out of date where they conflict with this note.
**Since the switch:** replay dice are back (`rnd()`, `S.seed`, `S.rng`; only new life codes and the AI storyteller's roll use `Math.random()`; Undo year rolls fresh dice on purpose). Countries now affect everyday life: `payF()` scales salaries, part-time, side gig and talent pay by the country's wage level; `shopPrice()` scales homes by rent level and cars by `0.6 + 0.4 x pp`; `tuition()` scales by `pp`. Check used: USA lives (all factors 1) are identical before and after. Each country has its own economy (`S.cecon`, `countryEconYear()`, `localPhase()`, `bizPhase(b)`): jobs, loan rates, home prices and business sales follow it. `S.econ` stays the world economy for stocks, crypto, bonds, savings and supplier prices. Countries follow a world turn half the time; riskier countries (high `vol`) have more recessions. 150 robot lives: median net worth 517k to 411k, mean 1.33M to 1.50M (more spread, not poorer). **Business running (latest):** products use one yearly demand (no seasons); launch includes a first product with automatic production (`autoQty`); an age-up warning for businesses with nothing to sell or nobody running them; a 💡 tip per business (`bizTip`); marketing is one level (`MKTL`); the price-lock contract is gone. Who runs a business is me (`b.life==='hands'`) or a hired CEO (`b.ceo`, stats ops/sales/people/integ plus a personality, see `runFx`, `ceoYear`, `runnerBlock`). Managers no longer exist (old ones become the CEO); each extra outlet pays its own store manager (`storeMgrCost`). Businesses for sale show last year's accounts (`saleFin`, `saleReport`).
`tools/stress.js` works with this version: 25 lives, seed 7, 0 errors, 0 year step errors, 0 bad numbers. Same seed gives the same fingerprint.

## What this is
One Life is a BitLife-style life simulator in the browser. You live one life year by year from birth to death: school, jobs, relationships, money, investing, property and businesses. When you die you can continue as your child (dynasty play). It is meant to be played as a published Claude artifact, and it also runs as a plain web page.

## Tech stack
- One file: `index.html`, about 235 KB. Vanilla JavaScript, inline CSS, no framework and **no build step**. We decided to keep it as one file.
- Fonts come from Google Fonts. Progress is saved in the browser's `localStorage`.
- The optional AI features (AI storyteller, AI obituary, AI investor pitch) use `window.claude.use('sample')`. That only works inside a Claude artifact. Anywhere else the game carries on without AI.
- Test tool: `tools/stress.js` (Node plus jsdom).

## Run it locally
- **Play:** open `index.html` in any browser. There is nothing to install.
- **Test:** needs Node 18 or newer.
  ```
  npm install jsdom@24
  node tools/stress.js index.html 25 7
  ```
  The arguments are the HTML file, the number of lives and a seed. A robot plays full lives (dynasties included). The report shows errors, broken numbers, speed, save size and a **fingerprint**. The same seed always gives the same fingerprint.
- **Environment variables:** none. There are no API keys or secrets.
- **Publish:** Artifact tool, `publish` action, with `file_path: index.html`. The live game is https://claude.ai/artifact/RLG41cydbEafzToL4TuZ1T (shared with anyone with the link). To update it from a new conversation, pass that URL as `url`, and keep the `sample` capability.

## Built so far
- The imported game: life events, 16 careers, investing, property, businesses, 42 achievements, 8 challenges, dynasties.
- Early product R&D and supplier system.
- **Replay dice (seeded randomness):** every game roll goes through `rnd()`. Each life gets a life code (`S.seed`), and the dice position (`S.rng`) is saved with the life. The same life code plus the same choices always gives the same life. `Math.random()` is used in only two places: making new life codes, and the AI storyteller's roll, so switching AI on or off never changes a life.
- **Yearly routine split into steps:** `YEAR_STEPS`, just above `ageUp()`, lists each yearly system in order (people, stats, prison, school, economy, university, work, income, business, angels, property, limits, events, net worth, decade review, death). Seeded robot runs gave identical fingerprints before and after the split.
- **Character picker:** a new life (first launch, "Start a new life" in Menu or after death) opens `pickLife()`: 3 random babies, each rolled from its own life code by `rollBaby()`, with Play, Customize (name, boy or girl, city, up to 3 traits), Reroll and Surprise me. `newLife()` now also accepts `traits` and `st`. Continuing as your child, tycoon mode and challenges skip the picker. Note: the robot's fingerprints differ from before because the picker uses the test's seeded `Math.random` at page load; with the old startup line the fingerprints are identical.
- Stress test: 75 lives and about 4,000 years with no crashes, broken numbers or stuck events. A year takes about 0.3 ms and saves are about 12 to 43 KB.

## In progress or broken
- **Lost version:** the master note describes a newer 280 KB version (Phase 1 and Phase 2: countries, taxes, board governance, factories, cash flow statement and more). That file was lost. This repo holds the older base. See `docs/MASTER_NOTE.md` section 0.5 for the exact gap.
- **Foundations clean-up, approved and half done.** Items 5 and B (see "Next tasks") are finished. These issues are still open:
  1. Unanswered popups (the queue `Q`) are not saved. Closing the game mid-decision loses the decision.
  2. Load only accepts save versions 3 and 4. Any other version starts a new life over the old save.
  3. Save errors are ignored silently.
  4. There is no export or import of saves.

## Next tasks (priority order)
1. **Save pending popups.** Planned design: at the start of each year, keep a snapshot of the life. Record which choice index is picked for each popup. On load, rerun that year from the snapshot using the saved dice, then reapply the recorded picks. Accept the result only if the rebuilt life matches the saved one exactly (ignore `aiNext`). Otherwise fall back to the saved life without the popups. Put the shared answer logic from `showNext()` in one function.
2. **Versioned save upgrades.** Set `SAVE_V = 5` and write one upgrade function per version (v3 to v4 is the existing `migrate()`; v4 to v5 adds `seed`, `rng` and `pending`). Never delete a save you cannot read: copy it to `onelife-save-rescued` and tell the player.
3. **Save safety.** Show a toast once when a save fails. Copy the main save to `onelife-save-backup` at the start of each year, and try that backup if the main save fails to load. Trim the log if a save grows past about 1.5 MB.
4. **Backup button in Menu.** Export the life (plus achievements and family tree) as text and as a downloadable file. Import it back, merging achievements and family trees. Also add "Start a life from a code" in Menu, using the replay dice.
5. **Label code sections by layer** (World, Life, Money, Business, Meta, UI), with a contents list at the top of the script.
6. Then follow the master note's section 12.2: People rebuild, then Story and events, then Countries v2, and so on. The Phase 1 and 2 features need rebuilding if they are still wanted.

## Key decisions and why
- **One HTML file, no build step:** simple to share and publish as an artifact.
- **Replay dice:** makes bugs repeatable and lets us prove that a code rewrite changes nothing (compare fingerprints).
- **Older file as the base (option 2):** the 280 KB version could not be found.
- **Working agreements** from the owner (master note section 1): discuss and confirm any new design before building, build in phases, test before publishing, be upfront about mistakes, write plainly, never use em dashes in game text, show money in US dollars.
- **The owner is not a programmer.** Explain in plain everyday language and give clear options with a recommendation.

## Must know to avoid breaking things
- **Never use `Math.random()` in game logic.** Use `rnd()`, `R()`, `pick()`, `wpick()` or `gauss()`. Otherwise replays and fingerprints break.
- **Protect saves.** The save key is `onelife-save-v3` (the name is old but correct) and `S.v` is 4. Changing the shape of `S` needs an upgrade step, or players lose their lives. Achievements and the family tree live in `META` under the key `onelife-meta`.
- **Add new yearly systems as a step in `YEAR_STEPS`,** not inside `ageUp()`.
- **Behaviour check for refactors:** record fingerprints for a few seeds before the change (`node tools/stress.js index.html 8 <seed>`), then check they are identical after. Balance changes are expected to change fingerprints, so check those against the balance numbers in the master note instead.
- **Edit safely.** Make edits that match exactly one place in the file (the old workflow used Python replacements that assert a single match). Syntax-check the script after every edit.
- **Top-level order matters:** `const` and `let` values must be defined before the boot code at the bottom of the script uses them.
- **AI features** must handle `sampleFn` being `null`, which is the case outside Claude.

## Bad CEOs
- runFx CEO range widened: worst CEO about -15% customers, +15% costs.
- ceoYear: CEOs with weak ops/sales risk a yearly costly mistake (up to 40% chance, 5-15% of sales), followed by a keep-or-fire popup. Candidates with ops or sales below 35 are tagged "Risky".
- A CEO (like running it yourself) covers one staff role, and CEO pay was lowered, so a café with a decent CEO can make money.

## Buying with funding, job interviews, partial rescue
- Buying a business for sale opens `buyView` (state `buyDeal`): own cash + acquisition loan (`buyLoanMax`, based on last year's profit) + investors (`buyInterest`).
- Jobs: `S.cexp[career]={yrs,lvl}` tracks experience. `openings()` builds a yearly list (S.jobOpen): static careers (police, teach, nurse, med, law) at entry level, senior roles up to your best level in fields you've worked, plus 3-5 random roles. Up to 3 interviews a year (`S.used.apps`). `applyJob` asks one IVQ question; answers lean on mood, looks or smarts. Odd jobs skip the interview. `hireChance` shows Long shot / Fair chance / Strong fit.
- deficitEvent: if one source can't cover it all, "put in what I can, then cover the rest" re-queues the event; disabled options say why.

## Character panel
- Tap the stat bars (`#statsWrap`) to open `charSheet`: core stats, karma, work ethic (`S.ethic`), fame, credit score (`creditScore()`, derived), skills `S.sk={biz,tech,ppl}`, traits.
- `yearSkills()` runs each year from `yrWork`. Effects: ethic affects job performance and running your own business; skills and karma feed `hireChance`; people skill feeds raises and networking; business skill feeds investors and `runFx('me')`; the credit score scales loan limits (`creditF`) and `loanRate`.

## Property market
- Property tab: "My properties" (propView='mine') and "Market" (propView='market', tabs mkKind home/car). `marketList()` builds yearly listings in S.mkList.
- Homes carry area (AREA: price, growth, yield), cond (COND: price, upkeep), beds, sqm, yld. Renovate from assetModal. `dealTag` shows Bargain/Overpriced with smarts 55+.
- Cars carry age and run; `carRun` is charged yearly in propertyYear, with breakdown risk rising with age, and appears in the cash flow statement. Old saves fall back to defaults.

## Putting money into a co-owned business
- `moveCash(b,'in')` with own<100% opens `putInModal`: shareholder loan `b.sl={bal,rate}` (repaid in simBiz by `repayOwnerLoan` before dividends, counted as debt in bizVal, repaid first on close/sale) or new shares at bizVal (auto if own>50%, otherwise a vote, once a year per business, not for listed companies). Plain deposit only at 100% ownership.

## Shareholder votes
- Board motions (motionPicker/runMotion) now also include 'expand' (g.exp, 2 yrs; gates new outlets/cities via canExpand when I don't control the company) and 'sale' (sell the whole company at saleOffer, everyone bought out).
- `shareholderMotion(b,g)` runs from govYear: other owners (>=10%) sometimes propose raising the dividend, cutting costs, selling, or firing the CEO. I vote with my stake; they vote as one bloc.

## Business financials
- `b.fh` keeps up to 10 years of {age,rev,ops,pre,net,cf,cash}, recorded after the cash flow statement each year. `opsCost(pnl)` = cost of goods + wages + owner pay + rent + marketing + other.
- New business tab 'fins' (`finsTab`): three headline figures with change from last year, P&L, cash flow statement, and a 5-year history. `bizSummary()` shows a table across all businesses at the top of the Business tab.

## CEO decisions, production shortfall, Market / My assets
- `ceoManage(b)` runs yearly before renewPlans when a CEO runs the business: nudges prices (up if sold out, down if stock left), turns on auto production, sets marketing from margin and mandate (`b.mand` grow/bal/cut), pays down loans on cut, opens outlets (grow/bal) and may borrow. Anything above `ceoLim(b)` (b.ceoLim, default $50k, -1 = no limit) becomes an approval popup. Controls live in runnerBlock.
- `planShort` replaces the silent production cut: pay the rest from my cash, take a bank loan, or make less. A CEO borrows automatically within its limit.
- Money tabs: 'prop' is now "Market" (home/car listings), 'assets' is "My assets".
- ceoManage now covers: prices, auto production, supplier search (rollSupplier, judged by ops), wholesale, rebrand, retiring losers, product research (goods) or R&D (others), processing plants, price tier/supplier tier (non-goods), lever choice, marketing level, celebrity deals, seasonal push, trend riding, staff pay, auto staff, firing weak key people, hiring key people, team building, outlets/new cities (loan-funded under grow), closing losing outlets, online, franchising, corporate contract bids, automation, buying buildings, insurance, paying down loans. Costs go through `spend()`: within ceoLim it happens, above it one approval popup per year. `skill(stat)` decides whether a choice is made well or at random.
