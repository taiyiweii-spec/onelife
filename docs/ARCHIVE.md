# One Life: Archive

Full history and detailed write-ups, moved out of the master note on 2026-09-29 to keep session start-up cheap. Read only when a detail is needed. Content below is the master note v5 as it stood before the move; its section 0 and 1 instructions (project_read, project_write) are obsolete, see docs/MASTER_NOTE.md.

---

# One Life: Master Note (v5)

A complete handover of the One Life game: what it is, how it is built today, how we plan to build it going forward, the full backlog, and how to keep going in a new chat.

---

## 0. How to use this note in a new chat

1. Open a new chat inside the "life" project. Do not attach the game file: it is already in the project.
2. Tell the new chat: "Read the master note first. Follow the working agreements in section 1. Check section 8 for what's next."
3. Where things live:
   - **Game (source of truth): `One_Life.html` in the project.** This is a single self-contained HTML file (one inline `<script>`, no `<script src>` files). **Correction, 2026-09-27 (business staffing session):** an earlier version of this note claimed the live game was a 16-file split build published as a claude.ai artifact, with the project's `One_Life.html` described as a stale pre-split copy. That could not be confirmed this session (no split files were found anywhere, and the project only lists `One_Life.html`), so the project doc is being treated as the authoritative single-file build going forward, edited directly and versioned via project_write. If a future session finds a published multi-file artifact that is actually newer, reconcile the two before continuing and update this note.
   - **Published artifact (for AI features), added 2026-09-27:** `https://claude.ai/artifact/95FEiEA9QhTYSxeDsSbcWN`. The AI storyteller, obituary, investor pitch and the new AI Assistant (3.5.20) all need `window.claude.use('sample')` to resolve, which only happens (a) inside claude.ai's artifact runtime, not a downloaded file opened locally, AND (b) when the artifact's stored `capabilities` includes `sample`. Publishing the file for the first time on 2026-09-27 without declaring capabilities left `sample` un-granted (confirmed by the publish tool's own warning); republished immediately after with `capabilities:{sample:{}}` to fix it. **Every session that republishes this artifact after editing `One_Life.html` must either omit the `capabilities` argument (carries the existing grant forward unchanged) or explicitly pass `capabilities:{"sample":{}}` again, never `{}`, which would clear it.** The private link above is for the user's own testing; it is not shared with anyone else.
   - **Tests:** `tests/` in the project (see section 3.4). A new session must re-fetch `tests/lib.js`, `syntax.js`, `playtest.js`, `oldsaves.js`, `balance.js`, `balance-baseline.json` and the four `tests/fixtures/*.json` files via `project_read` into a local `tests/` folder before running anything (they are not auto-present on disk).
4. Getting the game file into the workspace: `project_read` with `path: "One_Life.html"` (large files return a local disk path rather than inlining, which is the cheap route).

---

## 1. Working agreements (how the user wants to work)

1. **Clarify before committing.** Walk through what a new change means and confirm the design before touching code. Quick fixes to something already agreed can be done directly. Anything new gets a discussion first.
2. **Concise, direct, decision-oriented.** Short explanations, clear options.
3. **Build in phases.** Large requests are split into phases and chunks, tested between chunks.
4. **Test before publishing.** Run `tests/syntax.js`, `playtest.js --lives 6`, `oldsaves.js`, `balance.js` (or `run-all.sh` if present). Old saves must load. Balance numbers are compared with the saved baseline.
5. **Apply edits with exact-match replacements** that assert a single match. Keep a backup before large edits.
6. **Be upfront about mistakes.** If an edit fails or breaks something, say so plainly.
7. **Writing style inside the game and docs:** no em dashes, plain language. The syntax test counts em dashes; keep it at 0.
8. **Money is shown in US dollars** everywhere, even for foreign countries.
9. **After each completed block:** update this master note (change log, known issues, pending decisions) and hand over the updated file.
10. **Credit/usage awareness:** flag if usage is nearing 90%. Keep reads targeted. Large files (the game, save fixtures) go to disk, never inline into the chat.
11. **When the chat gets too heavy:** update this master note fully, then migrate to a new chat using section 0.
12. **Backlog is living.** New ideas get added to section 5 at whatever depth they're discussed at. Priority order can be revisited as items get built or new information comes in.
13. **Staying client-side for now.** No external server/database. `localStorage` per device plus manual export/import backup codes is the model until cross-device sync is explicitly prioritized (backlog item 25).
14. **Build small, verify, then extend.** Do one small verified thing first; add breadth and depth only once it's proven.
15. **Model choice.** Sonnet for routine content building. Opus for foundation/refactor work, designing complex new systems, and stubborn bugs.

---

## 2. Game overview

One Life is a BitLife-style life simulator. One turn is one year, from birth to death: school, jobs, relationships, money, investing, businesses. Dynasty play on death (continue as a child). Deep focus so far on the business and money simulation, and five special careers (acting, sports, singer, model, influencer).

---

## 3. Current technical architecture (as of this note)

### 3.1 File and stack
- **Single file:** `One_Life.html`, one inline `<script>` block, no external `.js` files, no build step. Vanilla JavaScript throughout, no framework.
- Google Fonts (Fredoka headings, Nunito body). All CSS inline. Mobile-first, max width 560px, light/dark themes via CSS variables.
- Bottom nav has 5 buttons: Work (`#bJob`), Money (`#bMoney`), Age (`#bAge`), People (`#bRel`), Activities (`#bAct`). Business lives inside a Work/Business toggle, split into Empire/Market/Founder pills (backlog item 6c, built 2026-09-27, see 3.5.16).

### 3.2 Core runtime objects
| Object | What it holds |
|---|---|
| `S` | The whole current life (the save): character, stats, money, relationships, jobs, businesses, investments, flags, log. `S.act`, `S.sp`, `S.mus`, `S.mdl`, `S.inf` each hold one special career's state. `S.tk` holds listed-company state. |
| `META` | Cross-life data: achievements, family tree, hall of fame, company history, settings. |
| `Q` | Queue of pending decision events. |
| `TICK`, `TCAP` | The market's list of tickers and their company sizes. |

### 3.3 Publishing model
The project's `One_Life.html` doc is edited directly (`project_read` to fetch, edit locally, `project_write` the full file back to the same path). It is also published as a claude.ai artifact for AI-feature testing (see section 0). Republish after every delivered block, keeping the `sample` capability.

### 3.4 How we test
Test scripts and fixtures are saved in the project under `tests/`. Setup in a new chat: `project_read` each file under `tests/` (including `tests/fixtures/*.json`) into a local `tests/` folder, `project_read` the game into a local file, `npm i jsdom@24`, then `node tests/syntax.js <game>`, `node tests/playtest.js <game> --lives 6`, `node tests/oldsaves.js <game>`, `node tests/balance.js <game>` in that order.

**Current reference results (2026-09-27, end of session: small bug-fix pass on top of the marketing/credit-line/staffing build):** syntax 1 script checked, 0 failed, 0 em dashes. Playtest 20 runs (`--lives 3`), 0 failed, FINGERPRINT `d4af01cc61e40377` (new baseline for this build; fingerprints are expected to change whenever any code changes, including the fixes in this block). Old saves 0 failed (fresh self-generated fixtures, legacy v3 save, pending-decision replay, net-worth reload all pass). Balance: 0 numbers moved more than 10% from the current baseline.

**Fingerprint/balance discrepancy, investigated, not resolved (background, earlier session):** an older note entry recorded a different fingerprint and a claimed clean run against the same baseline file; investigated and ruled out every change made in that block. No prior file snapshot or git history exists to bisect further. See known issues (3.6). Not chased further, not practically important right now.

### 3.5 Major systems already built (condensed reference)
- **World**: `ageUp` runs the year as ordered phases (`YEAR_PHASES`): tick, people, stats, prison, school, econ, stockdiv, margin, shorts, advisor, sec, college, work, pension, gig, business, angels, acting, sports, music, modeling, influencer, property, normalise, events, history, decade, death, wrapup. 16 countries, 30 base tickers plus IPO pool, bankruptcy/delisting, splits, bubbles, mergers.
- **Life**: character stats, 14 traits, fame, 19 full-time careers, 5 part-time jobs, 9 majors, five special careers: acting, sports, singer, model, influencer.
- **Money**: personal finance, property, deep investing.
- **Business**: 17 business types, full supply chain and governance sim. Staffing is demand-linked for all 11 goods/services types (see 3.5.6 and 3.5.28). Full marketing funnel with channels, followers, e-commerce and a real credit line (see 3.5.23 to 3.5.27).
- **Meta**: life events, AI storyteller, achievements, challenges, legacy/dynasty, saves, undo, backup codes.
- **Saves:** `SAVE_V=5`. New fields are added as additive defaults in `fillDefaults`, so old saves load with no version bump.

#### 3.5.6 Business staffing tied to demand and capacity (built 2026-09-27)
Goods businesses (`GOODS = ['truck','cafe','restaurant','bar','farm','fashion','dealership']`, `isMaker(b)`) previously had a flat staff requirement (`T.staff * locations`) that never reflected actual demand, and the hiring slider allowed hiring well past that number with no real effect. Redesigned so:
- **Hard hiring cap per outlet.** `staffCard`'s slider max for goods businesses is now `needStaff(b)` itself (today's per-outlet baseline, e.g. restaurant 9/outlet, truck 2/outlet, dealership 20/outlet), not a loose `need*2` guess. You cannot hire above what your outlets support. `b.staff` is clamped down to this cap on render if an old save is above it.
- **Staff caps production capacity.** New `staffFactor(b)` = `clamp(b.staff / needStaff(b), 0.2, 1)` for goods businesses (1 for every other type). `baseCap` (which feeds `prodCap`, the hard per-product production/sale ceiling) is multiplied by this factor. Floor is 20%: a goods business can never be pushed to zero output just by cutting staff to the minimum, but it can be cut hard. Services (gym/salon/hotel/clinic) were left untouched this round, they already size staff from the booking plan, a different but workable causality. **Superseded 2026-09-27 (later, backlog 6d): services now get the same hard cap, see 3.5.28.**
- **More outlets still auto-hire more staff.** Unchanged: `needStaff` already scales with `locs`, and `syncStaff` runs on every Business-tab render, so auto-hire (the default) keeps pace with new outlets exactly as before.
- **Market demand shown on the Products tab.** Each product row now shows `Market demand ~X/yr, capacity Y/yr` (previously only visible inside the per-product plan modal), and the tab's intro paragraph adds a staffing line for goods businesses (`Staff N of M hired for K outlets[, so production capacity is reduced]`).
- **Why balance is unaffected for default play:** auto-hire (the default, `autoStaff !== false`) still sets `b.staff = needStaff(b)` every render, so `staffFactor` is exactly 1 whenever the player hasn't manually touched staffing, identical to the old flat behaviour. The staffing lever, and its consequences, only activate if the player deliberately understaffs or tries to overstaff. Confirmed by balance.js: every one of the 11 business types plus the 7 cafe-by-country checks came back at +/-0.0% vs the saved baseline.
- **Interaction with the existing soft demand penalty:** `simBiz`'s `ratio = staff/needStaff(b)` (feeding into realized yearly demand via `common`) was left as is. Manual understaffing now compounds: less can be made (hard `prodCap` cut) and fewer customers are captured (existing soft `ratio` cut). This was a deliberate choice ("do what makes most sense") rather than an approved design point; flag if it feels like double-jeopardy in play.
- **Correction, 2026-09-27 (later same day):** the hard hiring cap and `staffFactor` were actually gated on `isGoods(b)`, not `isMaker(b)` as described above and as intended. `isGoods = hasProd(b.type)` is true for all 11 product/service business types, so gym/salon/hotel/clinic were also silently getting the goods-only cap and capacity floor this whole time, contradicting the "services left untouched" claim above. Fixed both gates to `isMaker(b)`. Found while investigating an unrelated balance drift (see 3.6 and 7); confirmed the fix changes no balance numbers (test businesses never understaff, so `staffFactor` was already 1 regardless of which gate was used) but does matter in live play whenever a service business is deliberately understaffed. **Reversed deliberately 2026-09-27 (later, backlog 6d): the gate is back to `isGoods(b)`, this time as an intentional, tested design choice rather than an accidental one. See 3.5.28.**

#### 3.5.7 Production plan slider capped to business cash (built 2026-09-27)
The per-product plan editor (`planModal`, opened from a product row) let the quantity slider and number box reach up to `capital(b)` (business cash plus available credit line), so dragging the slider could silently commit the business to a plan that would draw on credit with no visible warning. Changed so the slider's budget is business cash alone: `cap=Math.max(0,b.cash)` instead of `cap=capital(b)`. The slider and number input now hard-stop at what cash (plus whatever is already paid toward the current plan) can afford; they cannot reach into the credit line at all. Labels updated to match: "Available capital after this plan" is now "Business cash after this plan," "Capital limits me to X" is now "Business cash limits me to X," and the footer note now reads "The plan cost can't exceed business cash, and renews automatically each year" (previously said the plan draws from cash then the credit line).
- **Scope:** only `planModal` (the interactive editor a player opens by hand). The automatic yearly re-planning path (`renewPlans`/`autoQty`/`optPriceQty`) and the "can't afford next year's plan" prompt (`planShort`, which can still offer a bank loan or ask the player to pay personally) are unchanged, that system still allows credit-line use because it is asking permission for it explicitly.
- **Why balance is unaffected:** `planModal` is never called by `balance.js`'s simulation (`seedProducts` then `simBiz`), so this change cannot move any balance number by construction.
- **Follow-up (same day):** the slider's `max` attribute now shows `maxCap` (full production capacity) instead of `maxQ` (cash-affordable amount), so the track always spans the business's real ceiling; `upd()` snaps the thumb and number box back to `maxQ` on every input, so the value itself still can never exceed cash. The auto-production toggle's description text was removed and the toggle moved to sit below the quantity controls instead of above them.

#### 3.5.8 New businesses start hands-on, no auto-hired CEO (built 2026-09-27)
`startBiz`'s launch flow used to always hire a CEO (`makeCEO(b,45,70)`) and set `b.life='delegate'` the moment a business was founded, for both Simple and Tycoon mode, with no option to start hands-on. Changed the launch code to `b.life='hands'` instead, no CEO, no CEO wage, you run it yourself from day one. Delegating to a CEO later is unchanged (People tab, "Hand it to a CEO").
- Not covered by `tests/playtest.js`, which creates test businesses through a `bizTypes` shortcut that never calls `startBiz`. Verified separately by driving the real launch UI in jsdom and running several simulated years on the result (see 7, 2026-09-27 entry).

#### 3.5.9 Live "current overhead" display in Finance (built 2026-09-27)
User wanted to see overhead cost (wages, rent, etc) in the Finance tab without waiting for a year to close. New `currentOverhead(b)` helper computes, from live state only: staff wages (`b.staff*wagePer(b)+storeMgrCost(b)`, plus team and CEO wages), owner salary, rent (same formula `simBiz` uses), marketing (`mktCost`+celebrity cost), loan payment, and credit line interest (extended 2026-09-27 later to also include online-channel running costs, see 3.5.26). Deliberately excludes cost of goods and tax, both scale with sales and are only known after a year actually runs. Rendered as a new "Current overhead" block at the top of `finsTab`, ahead of the "financial statements appear after the first full year" gate, so it shows immediately on a freshly founded business and continues to show alongside the historical P&L afterward.

#### 3.5.10 CEO candidates hidden until you go looking (built 2026-09-27)
`runnerBlock` (the People tab's "Who runs it" section) used to always render the 3-candidate "CEO candidates this year" list and the headhunter option underneath, whenever the business wasn't already CEO-run, whether or not the player had any interest in hiring one that visit. Changed so the list only renders when the player has actually asked to see it: new transient (not saved) global `ceoPickFor`, set to the business id when "Hand it to a CEO" (hands-on case) or the new "Hire a CEO" button (nobody-in-charge case) is clicked, only then does the candidate list, headhunter option and a Cancel button appear. Clicking "Hand it to a CEO"/"Hire a CEO" no longer changes `b.life` by itself, only actually picking a candidate does (sets `b.ceo`, `b.life='delegate'`, clears `ceoPickFor`); Cancel clears `ceoPickFor` with no other effect, leaving the business exactly as it was.

#### 3.5.11 Business-type "lever" price modifier: dead code, decision still pending (found 2026-09-27, partial fix attempted and reverted 2026-09-27)
The lever's `p` (price) modifier only takes effect for the 6 "abstract revenue" business types (realty, tech, music/label, construction, gaming, lawfirm), which compute one lump `rev=demand*P.p*(L.p||1)*cty(b).pp` per year. For the other 11 types (all 7 `GOODS` plus all 4 `SVCS`, fashion included), price is set per-product/per-service instead, and neither `bp()` (suggested price) nor `prodMult()` ever reads `lev(b).p`, so any lever option on those 11 types that lists a `p` modifier (e.g. restaurant's Fine dining, bar's Cocktail lounge, salon's Celebrity stylist, dealership's Luxury, hotel's Resort, clinic's Cosmetic, farm's Organic/Vineyard) does nothing automatically: picking it shrinks demand as advertised but does not raise what you actually charge, the player has to go raise price by hand in Products/price-tier to realize the "premium" positioning the option's name implies.
- **Attempted 2026-09-27:** wiring `lev(b).p` into `bp()` (`const bp=(b,P)=>+(P.price*cty(b).pp*(lev(b).p||1)).toFixed(2);`). Caused severe balance regressions: bar -64.9%, car dealership -23987.9% (small profit to catastrophic loss), salon -149.5%, hotel -213.0% vs baseline. Root cause: these 4 types' **default** starting lever option has a below-1 `p` multiplier (bar's dive bar 0.8, dealership's used cars 0.6, salon's basic cuts 0.85, hotel's motel 0.6) that was previously completely inert; making it live cut default year-1 prices 15-40% while the paired `d` (demand) bonus, tuned assuming no price effect, stayed the same.
- **Reverted** back to the original `bp()` (no `lev(b).p` read) rather than attempt a rebalance inline, since fixing this properly needs re-tuning the `d`/`c` lever values across every affected type (or scoping the fix to only non-default lever choices, so a business's starting price is never silently cut), which is a real design/rebalancing decision, not a quick fix.
- **Still not fixed.** See 3.6 and section 8 for the pending decision.

#### 3.5.12 Finance tab: "Projected this year" gross profit/cash flow (built 2026-09-27, revised same day)
User wanted a forward-looking projection alongside the (now separately shown) historical and current-overhead figures. First built as projected revenue; user then corrected it to projected **gross profit** (revenue minus cost of goods), which is what shipped. `projectedFinancials(b)` sums, per product: `revenue += min(stock+plannedQty, estDemand(b,pr,pr.price))*pr.price`, `cogs += planCost(b,pr,plannedQty)`, returns `{revenue, cogs, gross:revenue-cogs}`, `null` for the 6 abstract-revenue types (no `b.products` to sum). The "Projected this year" block in `finsTab` shows "Projected gross profit" and "Projected cash flow" (gross profit minus `currentOverhead`, 3.5.9) as two tiles, with a caption line showing the revenue/COGS breakdown. Only renders for the 11 goods/services types. Still excludes tax (unknowable without a full year running) and flags that actual demand will vary.

#### 3.5.13 Plan editor shows stock on hand; automatic production now nets it out (built 2026-09-27)
Two related changes to `planModal` and its automatic-production path:
- Added a small "In stock now: X" note under the quantity slider/number box (goods only, hidden for services since they don't carry stock the same way).
- Found and fixed a real bug: `optPriceQty` (the function behind the "Automatic production and pricing" toggle, and behind `renewPlans`'s yearly auto-renewal for any product with `pr.auto=true`) picked its profit-maximizing quantity as `min(estimatedDemand, prodCap)` with no regard for existing stock, so an auto-managed product with leftover inventory kept getting a full fresh batch made on top of what was already sitting there, every year. Fixed to compute a `carry` (leftover stock, 0 for services and perishables) and only search for the quantity needed to cover the shortfall.

#### 3.5.14 Strategy tab: short effect line under each lever choice (built 2026-09-27, rewritten same day for clarity)
`levText(b,o)` renders a one-line plain-language summary of what each lever option does (skipping the dead `p` modifier for the 11 types where it does nothing, see 3.5.11), shown under the lever picker and updating live when the player switches options.

#### 3.5.15 Reputation now biases the random supplier offers you get (built 2026-09-27)
`rollSupplier(b)` shifts its quality roll by `round((b.rep-50)/3)`, clamped to [5,99]. No-op at the default starting reputation of 50, biases supplier-search and CEO auto-switch results better above 50, worse below.

#### 3.5.16 Business nav restructure: Work/Business toggle, Empire/Market/Founder pills (built 2026-09-27, backlog item 6c)
Business moved out of the Money sheet into its own Work/Business toggle (`jobSheet()` now opens `drawWork(s)`), split into Empire (businesses I run), Market (buy or start a business), Founder (founder activities). New "My empire" aggregate summary card and a "Needs attention" list flagging cash-negative, low-runway, loss-making, understaffed or ousted businesses.

#### 3.5.17 Product rows show gross profit and margin % (built 2026-09-27)
Each product row on the Products tab now shows "Gross profit $X (Y% margin)" under last year's units sold, computed from the already-stored `pr.last.rev`/`pr.last.cost`.

#### 3.5.18 Undo verified complete; death screen can now undo (built 2026-09-27)
Confirmed `takeSnapshot()`/`doUndo()` already reverts every meaningful field. Added a dedicated "Undo, go back to age N" button directly inside the death modal (previously unreachable since the generic header undo button is blocked while any modal is open).

#### 3.5.19 Business detail tabs tidied: Growth folded into Strategy, Financials folded into Overview (built 2026-09-27)
Tycoon-mode tab bar reduced from 8 tabs to 6: Overview, Products, Strategy, People, Finance, Risk. Growth's content moved into Strategy under its own heading; Financials reached only through Overview's "Full financials" link, with a back button. Simple-mode businesses keep their old 5-tab bar unchanged (no Strategy tab to fold into, flagged as a known inconsistency in 3.6).

#### 3.5.20 AI Assistant: ask Claude about your life or businesses (built 2026-09-27)
New Menu row "AI Assistant" (shown only if the game's existing built-in Claude integration, `sampleFn`, is available) opens a simple chat sheet. Sends a system-style instruction, the existing `lifeFacts()` snapshot, recent chat turns and the new question, using the cheap/fast model tier. Chat history is in-memory only, not saved. Only works when the game is opened as a claude.ai artifact with the `sample` capability declared (see section 0); discovered and fixed a real gap where the artifact had never declared that capability, so every AI feature silently did nothing even inside the artifact runtime, for as long as this code has existed.

#### 3.5.21 Expand to a new city: a lightweight second growth lever alongside the outlet curve (built 2026-09-27)
`effLocs(b)` now spreads `b.locs` evenly across `b.cities` virtual buckets and sums the existing per-bucket diminishing curve independently in each. New "Expand to a new city" action (Strategy tab's Growth section) costs `outletCost(b)*2.5`, opens one outlet in a real named city drawn from that country's city list, increments both `b.locs` and `b.cities`, capped at `CITY_CAP(b)`.

#### 3.5.22 Awareness stat and a Reach tab with TAM/SAM/SOM (built 2026-09-27, backlog item 6, lightweight version)
New `b.aware` stat (0-100, default 50, null-safe via `awareOf(b)`), drifting 20%/yr toward a target set by marketing, outlets, celebrity deals and being online. `awareMult(b) = 0.7 + 0.006*awareOf(b)`, exactly 1.0 at the default 50. New Reach tab (tycoon-mode, physical/outlet-based types only) showing Total addressable market, Within my reach, and I actually serve. **Superseded/absorbed 2026-09-27 by the marketing funnel (3.5.23 onward): `mktSize`/`reachable` now do this job with real distribution math, and the Reach tab was replaced by the Marketing tab.**

#### 3.5.23 Marketing funnel Phase 1: customer base, churn, budget slider, Marketing tab (built 2026-09-27, backlog 6e)
Every business has a persistent customer count `b.cust`. `custFlow(b,budget)` computes organic + paid customers minus churn each year; demand uses `custMult(b)=b.cust/custRef(b)` in place of the old flat multipliers. `MKT`/`MKN` (per-type CPA, ARPC, churn, penetration, nature), `custRef`, `mktSize` (TAM/SAM), `reachable` (distribution), `fitF` (rep x quality x rivals), auto-budgeting, LTV. Marketing tab: bottleneck hint, funnel bars, auto toggle or a $ slider, celebrity deals, seasonal push, market size. Re-baselined on purpose.

#### 3.5.24 Marketing channels Phase 2: channels, followers, national awareness, social media manager (built 2026-09-27, backlog 6e)
11 channels (`CH`) with real cost models (CPM, CPC, per flyer) and fit by business nature. Awareness math combines channel lifts, followers, national reach. Followers grow from content/influencers/social ads, fade without posting, never direct sales. National awareness (`b.awareN`) from national channels, followers, celebrity, fame, city count. Social media manager (`b.smm`) automates budgeting, boosts channel effectiveness and follower growth, halves scandal risk. Re-baselined.

#### 3.5.25 Buildings slider: buy and sell (built 2026-09-27)
Replaced the one-at-a-time "Buy a building" row with a slider for `b.prem`: slide right to buy, left to sell (90% back after agent fees). Each owned building saves rent.

#### 3.5.26 Marketing Phase 3: e-commerce and online channels (built 2026-09-27, backlog 6e, final marketing phase)
Replaces the old flat `b.online`/`onlineF` demand bonus with a real distribution system. **Core design principle, confirmed with the user before building:** online routes are distribution, not an instant demand multiplier. They raise how much of the market a business can reach, which then flows into customer growth over time through the existing funnel (3.5.23), exactly like opening a new outlet does.
- **Outlet-equivalent model.** New `distLocs(b) = effLocs(b) + ecCap(b)` replaces bare `effLocs(b)` everywhere demand is sized (`custRef`, `estDemand`, `goodsYear`'s demand calc, `simBiz`'s demand calc, and the outlet-closing cash-scaling line). Each open online route is worth some fraction of a physical outlet (`ecUnit`): a marketplace listing is worth a flat 0.35 of an outlet (it brings its own shoppers); a business's own online store is worth 0.1 to 1.0 depending on followers and national awareness (it needs its own traffic); travel booking sites for hotels scale with reputation; delivery apps are a flat 0.3. `ecCap(b)` sums these across whichever routes a business has open, capped per business type (`ECMAX`) so online can never fully replace a physical footprint.
- **Six route types (`EC`), by business nature:**
  - Own online store and Marketplace, for the 3 retail-goods types (fashion, farm, dealership): marketplace charges 15% commission, own store charges no commission but 2.9% + $0.30 per order in payment processing, plus shipping/packaging/returns.
  - Delivery apps, for the 4 food types (truck, cafe, restaurant, bar): 12 to 32% commission depending on local delivery regulation (`S.regs.deliv`), widens the local catchment (national-scale distribution, unlike the others) but does not carry physical shipping costs the same way.
  - Online booking, for gym/salon/clinic: no reach effect at all, instead cuts customer-acquisition cost about 15% and churn about 10% (it helps conversion and retention, not discovery).
  - Travel booking sites, for hotel: 15% commission, reach scales with reputation.
  - Website and listings, for the 3 local-professional types (realty, construction, lawfirm): same conversion-only shape as booking, a lead-gen site rather than a marketplace.
- **Shared stock, real costs.** `goodsYear` (the yearly per-product simulation for the 7 goods/services types) now splits realized sales between in-store and online using `ecSplit(b)` (a weighted share across whichever routes are open, capped by `ECMAX`), and online orders draw from the exact same inventory as in-store sales, no separate stock pool. Physical-goods routes (own store, marketplace) carry per-order shipping and packaging costs (`ECG`, by business type, e.g. fashion 7 days/$1.50 pack/25% return rate/1.8 units per order) and a return rate that restocks 85% of returned physical goods. Fashion returns 20 to 30%, farm and dealership much lower. Card-processing fees apply only to the owned-store route. Delivery-app and platform commissions come out of online revenue directly.
- **Separate P&L lines.** New `b.pnl` fields: `onRev` (revenue sold online), `ecFee` (commissions and payment processing), `ecShip` (shipping, packaging, card fees). The Finance tab's P&L breakdown lists "Online fees and commissions" and "Shipping, packaging and payments" as their own lines, and a new "Online and in store" section (shown whenever a business has any online revenue) breaks out sold-in-store vs sold-online, online channel costs, and what is left after those costs as a percentage of online sales.
- **Marketing tab: "Where people buy" section (`ecBlock`).** Shows total outlet-equivalent selling power (physical plus online) and, per available route, its description, worth in outlets, current sales share once open, commission/fee, shipping cost, yearly running cost, and an Open (pay the setup fee) or Close (refund nothing, sales and the route both go away, reopening costs the fee again) button. Costs scale with the country's price level like other business costs. CEO auto-management (`ceoManage`) will open the cheapest unopened route on its own, same trigger condition as other growth spending.
- **Old saves.** `fillDefaults` seeds `b.ec={}` for every business; any old save with `b.online=true` auto-grants its type's non-owned-store routes for free (e.g. an old online fashion business keeps its marketplace access without paying again), confirmed via the user's chosen migration option.
- **Design confirmed with the user before building** (via AskUserQuestion): the "Where people buy" UI lives on the Marketing tab (not a new tab); online price defaults to the same price as in store (no separate online pricing tier); the local-professional types get a lead-gen website rather than full e-commerce; old saves auto-grant the matching non-owned route.
- **Balance-neutral when no route is open.** Confirmed by a byte-for-byte before/after comparison script against the pre-Phase-3 backup: 4 years of simulated revenue, profit and cash for fashion, farm, cafe, hotel and dealership are identical whether or not this code exists, as long as no online route has been bought, exactly as intended for a distribution mechanic rather than a demand multiplier.
- **First design attempt rejected before shipping:** an earlier version modeled online reach as a separate traffic pool with its own multiplier (`ecTraffic`/`reachParts`), found broken by direct functional testing (numbers on a wildly different scale from outlet reach, and opening a route could reduce total customers in one case). Replaced entirely by the outlet-equivalent model above before any of it reached the shipped build.
- Verified: syntax clean; playtest 23/23 (FINGERPRINT changed as expected, new fields on every business, see 3.4); old saves clean; balance 0 numbers moved (no route opened by any test fixture); a direct jsdom check of `ecBlock`'s rendered output confirmed correct outlet-worth, share, fee, shipping and running-cost text and working Open/Close buttons.

#### 3.5.27 Credit line: capped draws, two-tier interest, automatic repayment with a buffer (built 2026-09-27)
User asked why business debt could exceed its credit limit, and to have spare cash automatically pay the credit line down, with a cash-flow buffer kept back so repayment never starves the business.
- **Why debt could exceed the limit, explained:** four compounding causes existed before this fix: `spendBiz` (the function every automatic and CEO-driven business expense ultimately calls when cash runs short) drew on the credit line with no cap at all, growing `b.credit` past `creditLimit(b)` freely; the old interest calc compounded the balance itself by 10% every year on top of accruing more draws; `creditLimit(b)` is 20% of last year's revenue, so a bad year could shrink the limit out from under an existing balance; and bad credit (from repeated bankruptcies) zeroes the limit entirely while any existing balance stays.
- **User's chosen fix, confirmed via AskUserQuestion ("cap spending and penalise the rest"):** deliberate/discretionary spending is now capped at the remaining credit-line room, and whatever balance still ends up over the limit (from interest or a shrinking limit, not new draws) is charged a higher penalty rate instead of being blocked outright.
- **`spendBiz` rewritten** to draw only up to `Math.max(0, creditLimit(b) - b.credit)` from the credit line; anything beyond that room still comes out of cash (going negative if it must), it no longer grows the credit balance past the limit.
- **Two-tier interest**, replacing the old flat 10% that also compounded the balance: `interest = balanceWithinLimit*10% + balanceOverLimit*18%`, and the balance itself is no longer auto-grown by the interest calculation, interest is charged as a cash cost each year like any other expense. A log line calls out when a business is over its limit and paying the 18% rate.
- **Automatic repayment**, new `repayCredit(b)` called right after the existing `repayOwnerLoan(b)` each year: pays down `b.credit` by whatever cash is left after keeping back a buffer (`creditBuffer(b)`, the larger of one quarter of current overhead or 5% of last year's revenue), never below zero, never touching the buffer. A log line reports what was paid and what (if anything) is still owed.
- **CEO product-launch spending respects the same cap** (`maxAfford` now bounds auto-launched quantity by cash plus available credit-line room, not an unlimited draw).
- **Finance tab's Credit line description updated** to explain the two rates and the automatic buffer-aware repayment in plain language.
- **Bug found and fixed during testing:** `creditBuffer(b)` first divided the whole `currentOverhead(b)` return object by 4 instead of its `.total` field, producing `NaN` that propagated into `b.cash` for two tycoon fixtures. Fixed by reading `.total`; full suite re-run clean afterward (23/23 playtest, 0 oldsaves failed, 0 balance numbers moved).
- Verified with a dedicated functional script driving a business through a draw/over-limit-penalty/repay cycle in jsdom, confirming the balance never exceeds the limit from a deliberate draw, the 18% rate only applies to any residual over-limit amount, and repayment respects the buffer.

#### 3.5.28 Backlog 6d: demand-linked staffing/capacity extended to services (built 2026-09-27)
Before this change, services (gym/salon/hotel/clinic) sized staff with the same `needStaff` formula as goods businesses (used for wages, auto-hire and a soft demand penalty when understaffed), but had no hard capacity ceiling tied to staffing: their sellable capacity (`baseCap`, feeding `prodCap`) came only from `outCapU`, a space/market-based formula, and `staffFactor` (the goods-only hard cap from 3.5.6) was gated to `isMaker(b)`, excluding all four service types. Understaffing a gym or salon only softly dented next year's customer count, it never actually capped how many memberships or haircuts could be sold, unlike understaffing a restaurant, which hard-caps how much food it can make.
- **Considered and rejected: a fully staff-derived capacity ceiling for services**, using the existing `upStaff(b,P)` ("units per staff member a year" formula, already used elsewhere to size CEO auto-hiring against a service plan) as the actual production ceiling instead of `outCapU`. Checked the numbers before building: for a gym's top product, this would have roughly halved default full-staffing capacity (about 1,022/yr vs. the existing 1,947/yr), a real balance shift with no calibration built in, and it would have removed the existing per-product demand/competition scaling that `outCapU` already carries (a niche, low-demand service would get the exact same ceiling as a mainstream one). Not shipped.
- **What shipped instead: the goods-side `staffFactor` mechanism, extended to services.** `staffFactor(b)`'s gate changed from `isMaker(b)` back to `isGoods(b)` (all 11 goods/services types), and `staffCard`'s hard hiring cap (`needStaff(b)` as the slider max, with `b.staff` clamped down to it on render) changed the same way. This is the exact mechanism the 2026-09-27 "correction" in 3.5.6 had reverted (that earlier state was an unintended bug caused by a stale gate, not a designed feature; this time the same code path is a deliberate, tested choice). No new formulas, no new balance risk: `staffFactor` was already confirmed balance-neutral for default full-staffing play across all 11 types back when it accidentally applied this way (see 3.5.6), because auto-hire always sets `b.staff = needStaff(b)`, making the ratio exactly 1 regardless of which types the gate covers.
- **Effect in play:** a manually understaffed gym, salon, hotel or clinic now has its sellable capacity (`prodCap`) hard-capped at `staff/needStaff(b)` of normal, floored at 20%, exactly like a manually understaffed restaurant or food truck. Auto-hire (the default) is unaffected: `syncStaff` keeps `b.staff = needStaff(b)` every render, so `staffFactor` stays at 1 unless the player deliberately turns off auto-hire and cuts staff.
- **UI text already matched this design and needed no change:** the Products tab's intro paragraph for services already said "Capacity is limited by space in each outlet and by staff," which was previously an overclaim (staff wasn't a hard cap) and is now accurate.
- Verified: syntax clean; playtest 23/23, FINGERPRINT `aa2b9178f5b089cf` unchanged (default auto-hire play is a no-op for this change); old saves clean (4 fixtures, legacy save, pending-decision replay, net-worth reload); balance 0 numbers moved (same reason). A dedicated jsdom functional check on a manually-understaffed test gym confirmed the mechanism directly: full staff (6 of 6) gave capacity 1,978/yr, half staff (3 of 6) gave 989/yr (half, as expected), zero staff gave 396/yr (the 20% floor of 1,978).

#### 3.5.29 Small bug-fix pass: dealership reputation death-spiral fixed, dead SEGS/svcStaff code removed (built 2026-09-27)
Follow-up to a full business-mechanics audit (see 7). Three fixes, all quick and balance-neutral (year-1 balance test unaffected in every case), plus one attempted fix that was reverted:
- **Fixed: dealership (and any premium-tier business) reputation death-spiral.** `simBiz`'s reputation formula gated the premium-tier reward/penalty on the very stat it was modifying: `ptier(b)==='premium'?(b.rep>=65?2:-4):...`. A dealership starts at reputation 48 and is auto-priced into the 'premium' tier from year 1 by `optPriceQty`, so it ate a flat -4/yr reputation penalty forever, since it could never reach 65 while being punished at -4/yr for being under it. Changed the gate to `b.q>=65` (quality) instead of `b.rep>=65`, so the reward/penalty depends on something the owner can actually act on (staffing, supplier quality) rather than the stat being changed. Confirmed via the full test suite: this only affects `b.rep`'s year-over-year trajectory, not year-1 `lastPre`, so balance.js (a year-1 profit test) is unaffected by construction, as expected.
- **Fixed: removed dead `SEGS` customer-segment data.** `const SEGS={students:...,families:...,pros:...}` was defined but never read anywhere in the codebase. Deleted.
- **Fixed: removed dead `svcStaff` staffing function.** `const svcStaff=(b,over)=>...` was never called anywhere (superseded by the demand-linked staffing system in 3.5.6/3.5.28). Deleted. `upStaff` itself was left in place since it still has one live caller (`rdPicker`, for the "about X services per staff member" display text).
- **Investigated and found NOT a bug (no code change): "turnaround achievement can never unlock."** An earlier grep for `\.turn` found only the achievement-check line itself (`S.biz.some(b=>b.turn!=null&&b.turn<35&&b.rep>=70)`), suggesting `b.turn` was always null. The actual set site uses `turn:x.rep` (an object-literal key, not a property assignment with a leading dot), in `buyView`'s business-purchase flow: `turn:x.rep` correctly captures the purchased business's reputation at the moment of purchase, matching the achievement's description ("buy a struggling business and get it to 70% reputation"). No fix needed.
- **Attempted and reverted: wiring the dead lever `p` (price) modifier into `bp()`.** See 3.5.11 for the full writeup. Caused severe balance regressions for bar/dealership/salon/hotel because those types' default lever option has a below-1 price multiplier that was previously inert. Reverted; this needs a proper design/rebalance decision, not a quick fix. Still open, see 3.6 and section 8.
- Verified with the full suite on a fresh test run: syntax clean (1 script, 0 failed, 0 em dashes); playtest 20/20 (`--lives 3`), FINGERPRINT `d4af01cc61e40377`; old saves 0 failed (fresh self-generated fixtures); balance 0 numbers moved more than 10% from baseline.
- Delivered the updated `One_Life.html` and republished the claude.ai artifact (Version 11), capability carried forward.

### 3.6 Known issues and tech debt
| Issue | Impact |
|---|---|
| Personal debt has no floor | An unemployed character's own cash can go to minus millions with nothing forcing bankruptcy. This is separate from the business credit line (which now has a cap, a penalty rate and auto-repayment, see 3.5.27). Needs a design decision if the user wants a personal-debt floor too. |
| Angel-startup IPO path is dead code | Always pays out as an acquisition since 30 base tickers always exist. |
| Balance reference method unknown | Measured numbers are 1.5 to 2x higher than the original table; the saved baseline is used instead. |
| Salon/Hotel/Clinic balance drift, cause unknown | As of 2026-09-27 (pre-marketing-funnel), `balance.js` showed these three more than 10% off an older saved baseline, and the playtest fingerprint no longer matched a value recorded in an earlier note entry. Investigated and ruled out several candidate causes; root cause never found, no prior file snapshot or git history to bisect against. The baseline has since been re-tuned twice more (marketing Phase 1 and Phase 2), so this specific drift is against a now-superseded baseline; not re-checked against the current one since it was never resolved either way. Revisit only if a balance-sensitive change to hotel/clinic/salon is being made and the numbers look off. |
| Lever `p` (price) modifier is dead for 11 of 17 business types | Only the 6 abstract-revenue types (realty, tech, music, construction, gaming, lawfirm) actually apply it. Every goods/services type's "premium" lever option (fine dining, cocktail lounge, celebrity stylist, luxury cars, resort, cosmetic clinic, organic/vineyard farm) shrinks demand as advertised but does not raise the price you charge, you have to do that by hand. See 3.5.11. **A fix was attempted 2026-09-27 and reverted**: naively reading `lev(b).p` in `bp()` breaks balance badly for bar/dealership/salon/hotel because their default lever option has a below-1 `p` that was never meant to be live. Needs a proper rebalance pass (re-tune `d`/`c` across affected lever options, or scope the price effect to only non-default choices) before it can ship. Pending decision, see section 8. |
| Saves hold a full copy of the previous year (undo) | Saves are about twice as large as needed. |
| Dynasty handover drops listed companies | Existing behaviour, not changed. |
| No inflation or calendar year | Prices never change over a lifetime. |
| Rivals are a strength number, not real companies | Shallow competition system. |
| Take-private conversion size is capped | Very large and merely large companies convert to the same-sized business. |
| No cross-device state | Every device is a separate save (backlog item 25). |
| No work-hour cap / overstress mechanic | Deferred (backlog item 6b). A character can freely stack a job, a business, a side gig, a part-time job, and any number of special careers at once with no downside beyond yearly energy cost. |
| Five special careers are not yet unified | Acting, sports, singer, model and influencer share almost the same shape (offers, tiers, reputation, yearly tick) but are implemented as five separate, parallel code blocks. Backlog item 4 will extract the common scaffold. |
| No achievements for the four newest special careers | Sports, singer, model and influencer have no dedicated `ACH` entries yet. |
| Architecture note discrepancy (see section 0) | A prior version of this note described a 16-file split build published as a separate artifact; that could not be confirmed this session. Needs reconciling if a split build turns up elsewhere. |
| Simple-mode businesses still have a standalone Growth tab | Tycoon-mode Growth was folded into Strategy on 2026-09-27 (3.5.19), but simple-mode businesses have no Strategy tab to fold it into, so they keep their old 5-tab bar (Overview, CEO, Growth, Finance, Risk) unchanged. Revisit if this inconsistency bothers the user. |
| Quantity-based bulk discount, deferred (2026-09-27) | User asked that higher production quantity lower unit cost. Tried it two ways, both rejected by `balance.js` (several goods types swing far more than a modest cost cap should allow, since several business types are designed to run thin or negative year-1 margins by design). Reverted before shipping. Needs a genuinely different approach if revisited (e.g. only from year 2 onward, or scoped to a subset of types). |
| Recurring "can't afford next year's plan" prompt (`planShort`) not fully throttled | Neither `autoQty` nor `optPriceQty` caps its target at what the business can actually afford, only at demand and capacity, so a chronically undercapitalized auto-growing business can still be asked every year. The 3.5.13 leftover-stock fix should reduce how often this fires but does not remove the core cause. Still open, see section 8. |
| Marketing Phase 3 leaves the Products-tab per-product view without a dedicated "sold online" readout | The split between in-store and online units sold is in the yearly log line and in `pr.last.on`/`pr.last.ret` (internal data), but there is no dedicated UI element on the Products tab itself for it (the Finance tab's "Online and in store" section covers the business-level total). Not yet asked for; flag if the user wants per-product online detail. |

---

## 4. File split architecture

Not applicable to the file as currently found in the project (see the correction in section 0). If a genuine split build is located and confirmed current, this section should be restored and reconciled with section 3.1.

---

## 5. Full backlog, in priority order

**Foundation**
1. File split: status uncertain, see section 0 and section 4.
2. ~~**Career salary realism pass.**~~ Done (includes part-time jobs).

**Core loop depth**
3. ~~**Sports (special career).**~~ Done.
4. **Special-careers scaffold generalization.** From acting, sports, singer, model and influencer, extract the shared registry, tiers, offers, yearly tick and UI pattern.
5. **Storyline/event expansion.** More events and branching per age bracket (elderly life thinnest), more multi-stage callback chains, civic and political flavor events.
6. **Casino/gambling system.** Own file. Blackjack, poker, roulette, baccarat, slots, sports betting, horse racing. VIP tier, cheating with ban risk, problem-gambling arc.
6b. **Work-hour cap / overstress mechanic (Phase B).** Limit how many income sources can be run at once without a downside. Not yet designed.

**Business depth (new, 2026-09-27)**
6c. ~~**Business nav restructure.**~~ Done 2026-09-27, see 3.5.16.
6e. **Marketing redesign: funnel, customer base, channels, e-commerce (confirmed 2026-09-27). DONE.** Phase 1 (3.5.23), Phase 2 (3.5.24) and Phase 3 e-commerce (3.5.26) all built and tested. Marketing has its own tab, applies to all 17 types. The credit-line fix (3.5.27) shipped alongside Phase 3 as a priority interrupt.
6d. ~~**Extend the demand-linked staffing/capacity model (3.5.6) to services.**~~ Done 2026-09-27, see 3.5.28.
6f. ~~**Small bug-fix pass: dealership rep trap, dead SEGS/svcStaff.**~~ Done 2026-09-27, see 3.5.29. Price-lever fix still pending (see 3.6, section 8).

**Special careers (breadth)**
7. ~~**Singer, Model, Influencer.**~~ Done. Built directly on the acting pattern (per-gig payout, no shared engine yet; see item 4).
8. **Politician, Crimelord.** Own shape. Politician: faction reputation, election cycles, corruption. Crimelord: heat, rival gangs, crew, jail as a core mechanic, "get out before caught."

**Life-sim roundness**
9. Dating pool / multiple relationship options.
10. Friendship relationship type.
11. Divorce/custody/alimony depth.
12. Personal insurance and estate planning.
13. Social class/reputation as a visible stat.
14. Mental health/addiction system.

**World breadth**
15. More countries (content pass only).
16. Military service.
17. Random world news feed.

**Asset/hobby breadth**
18. Vehicles beyond cars.
19. Collectibles/hobbies as an investment class.
20. Charity/philanthropy system.

**Late-life/flavor polish**
21. Active retirement lifestyle choices.
22. Funeral/death planning choices.
23. Language/culture friction when moving abroad.

**Ongoing**
24. Achievements for every new system, shipped alongside each item. Gap: sports, singer, model, influencer have none yet.

**Future**
25. Cross-device sync.

**Out of scope for now:** weather/climate system; deep country mechanics; full crimelord/politician design until item 8 starts; personal (non-business) debt floor, see 3.6.

---

## 6. Balance reference

`tests/balance-baseline.json` is the reference. **Re-baselined twice for the marketing funnel: 2026-09-27 for Phase 1 (3.5.23), again same day for Phase 2 channels (3.5.24).** Phase 3 e-commerce (3.5.26), the credit-line fix (3.5.27), the services-staffing extension (3.5.28, backlog 6d) and the small bug-fix pass (3.5.29, backlog 6f) were all confirmed balance-neutral against that same Phase 2 baseline (0 numbers moved more than 10%): e-commerce only fires once a route is bought (no test fixture buys one), the credit-line fix only changes behavior once a business actually draws on or exceeds its credit line, the services-staffing extension only changes behavior once a business is manually understaffed, and the 3.5.29 fixes only affect year-over-year reputation drift or delete genuinely-unused code (none of which the year-1 balance test can see).

---

## 7. Change log

Full history through the file split, career salary pass, sports, and singer/model/influencer is preserved in earlier note versions (see the project's prior doc revisions if needed; not reproduced here to keep this note a manageable size). Entries through the business nav restructure, product gross profit, death-screen undo and the Phase 1/2 marketing funnel are preserved in the prior revision of this note; only entries from Phase 3 onward are new below.

**2026-09-27, buildings buy/sell slider (3.5.25):**
- User asked for a slider to buy and sell buildings. Quick UI change on the existing buildings mechanic; selling added at 90% of cost. Syntax, playtest (23/23, FINGERPRINT be30bfa68b9ae4fc unchanged), oldsaves and balance (0 moved) all clean. Published artifact Version 8.

**2026-09-27, Marketing Phase 3 design confirmed, then a mid-session credit-line interrupt:**
- Given the go-ahead to build Phase 3 (e-commerce and online channels, backlog 6e). Proposed the outlet-equivalent distribution design (online routes add selling power, not an instant demand bump) and confirmed four open design questions via AskUserQuestion: UI lives on the Marketing tab; online price defaults to the same as in-store; local-professional types get a lead-gen website; old saves auto-grant the matching route. Started building.
- Mid-build, user asked, unprompted: why can business debt exceed its credit limit, and could spare cash auto-repay the credit line with a cash-flow buffer kept back. Treated as a priority interrupt. Explained the four causes (see 3.5.27), then asked a follow-up AskUserQuestion on how over-limit debt should be handled; user chose "cap spending and penalise the rest." Built and shipped the credit-line fix (3.5.27) before resuming Phase 3.
- Bug found while testing the credit-line fix: `creditBuffer(b)` divided the whole `currentOverhead` object instead of its `.total` field, producing `NaN` cash for two tycoon fixtures. Fixed; full suite re-run clean (23/23 playtest, 0 oldsaves failed, 0 balance numbers moved).

**2026-09-27, Marketing Phase 3 built in three chunks (3.5.26):**
- **Chunk 1 (engine):** first attempt modeled online reach as a separate traffic-multiplier pool (`ecTraffic`/`reachParts`); a direct functional test caught it producing numbers on the wrong scale and, in one case, opening a route reducing total customers. Replaced entirely with the outlet-equivalent model (`ecUnit`/`ecCap`/`distLocs`), verified monotonic and correctly scaled over both 1-year and 6-year horizons, and confirmed balance-neutral (byte-identical multi-year revenue/profit/cash vs a pre-Phase-3 backup, for 5 business types, with no route opened).
- **Chunk 2 (P&L):** rewrote `goodsYear` to split realized sales between in-store and online (`ecSplit`), sharing stock, applying shipping/packaging/returns for physical-goods routes and commissions/processing fees for all routes, and added the `onRev`/`ecFee`/`ecShip` P&L fields plus the Finance tab's new "Online fees and commissions," "Shipping, packaging and payments," and "Online and in store" breakdown.
- **Chunk 3 (UI):** replaced the old flat "Launch online sales" row with a redirect note, and built the Marketing tab's "Where people buy" section (`ecBlock`): total outlet-equivalent power, per-route cards (worth in outlets, sales share, fee, shipping cost, running cost), Open/Close buttons. Updated the funnel-step captions and the Market size paragraph to describe national vs city-bounded reach depending on whether a wide-reach route (delivery apps) is open.
- Verified after each chunk with the full suite (syntax, playtest 23/23, oldsaves, balance) plus targeted jsdom functional checks; final confirmation after Chunk 3 included a direct render check of `ecBlock`'s output (correct outlet-worth, share, fee, shipping and running-cost text, working Open/Close buttons, no console errors).
- Delivered the updated `One_Life.html` (Phase 3 plus the credit-line fix together, since the credit-line work landed mid-Phase-3) and republished the claude.ai artifact, capability carried forward.

**2026-09-27, backlog 6d: services staffing extended (3.5.28):**
- User picked backlog item 6d (extend demand-linked staffing to services) as the next item, from a choice of four candidates (6d, item 4 special-careers scaffold, item 6 geography, or the personal debt floor).
- Proposed two real options plus "leave it": extend the existing goods-side hard cap (`staffFactor`) to services as-is, or replace services' space-based capacity with a fully staff-derived one using `upStaff`. Explained the trade-off (the second is arguably more realistic but uncalibrated and would have dropped default gym capacity by about half, plus removed the existing per-product demand/competition scaling). Given the go-ahead to proceed with best judgment.
- Checked the numbers for the staff-derived option before building anything (about 1,022/yr vs the existing 1,947/yr for a gym's top product at default staffing), confirmed it would not be balance-neutral, and chose the calibration-free option instead: reused the goods-side `staffFactor`/hard-hiring-cap mechanism, gate changed from `isMaker(b)` back to `isGoods(b)`. This is the same code path as the accidental pre-3.5.6-correction state, this time deliberate and tested.
- Verified: syntax clean; playtest 23/23, FINGERPRINT unchanged (`aa2b9178f5b089cf`); old saves clean; balance 0 numbers moved. A dedicated jsdom functional check confirmed the mechanism on a manually-understaffed test gym: full staff gave capacity 1,978/yr, half staff gave 989/yr, zero staff gave 396/yr (the 20% floor).
- Delivered the updated `One_Life.html` and republished the claude.ai artifact (Version 9), capability carried forward.

**2026-09-27, full business-mechanics audit (no code changes, report only):**
- User asked to review every business type's mechanics for internal consistency, since some biz logic was suspected to be missing for some types. Full audit delivered: dead price lever for 11/17 types (see 3.5.11), dead `SEGS` data, dead `svcStaff` staffing model, an emergent auto-pricer tier-drift pattern, and the dealership reputation death-spiral (root-caused). Retracted an initial "label/games always lose money" false alarm (was a testing-methodology artifact from disabling the RNG-driven hit mechanic, not a real bug). Gave per-industry mechanic-improvement suggestions and presented three follow-up options: (A) small bug-fix pass, (B) big depth pass for the 6 abstract-revenue types, (C) per-industry flavor content. Recommended A then B; noted A only needs Sonnet, B needs Opus.

**2026-09-27, small bug-fix pass (3.5.29, backlog 6f):**
- User approved option A from the audit above ("Ok now fix it"). Session ran out of context mid-build; the in-progress fixes (rep formula, SEGS, svcStaff) had been made to a local working copy but never published back to the project doc before the context reset, so they were lost when a separate, much larger patch (the full marketing funnel, credit line and services-staffing work, 3.5.23-3.5.28) landed on the canonical file in the meantime.
- User flagged a new patch was in place and asked for the fix-it pass to be read through and redone on top of it. Confirmed directly (grep) that the current `One_Life.html` still had the original dealership rep trap, `SEGS` and `svcStaff` all present, so nothing from the marketing/credit-line/staffing work depended on or conflicted with the pending fixes.
- Reapplied the same three fixes plus the price-lever attempt-and-revert (see 3.5.29 above for full detail). Ran the full suite fresh (had to regenerate test fixtures locally, since the old self-generated fixtures from the aborted session were not carried over): syntax clean, playtest 20/20 (`--lives 3`), oldsaves 0 failed, balance 0 numbers moved.
- Delivered the updated `One_Life.html` (project doc) and republished the claude.ai artifact. The publish required reading the full 4411-line stale live artifact version first (the tool's anti-clobber gate); diffed it against the pre-edit working copy first and confirmed the only differences were the artifact tool's own HTML wrapper tags, so no actual content needed merging in, it was a formality read. Now Version 11.

---

## 8. Next step

0. ~~Marketing Phase 3 (backlog 6e).~~ **Done 2026-09-27** (3.5.26), together with the credit-line fix (3.5.27). Backlog item 6e is now fully complete (Phases 1, 2, 3).
0b. ~~Backlog 6d (staffing extended to services).~~ **Done 2026-09-27** (3.5.28).
0c. ~~Backlog 6f (small bug-fix pass: dealership rep trap, dead SEGS/svcStaff).~~ **Done 2026-09-27** (3.5.29).
1. **Pending decision: the dead lever `p` (price) modifier for 11/17 business types (3.5.11).** A naive fix was tried and reverted because it broke balance for bar/dealership/salon/hotel (their default lever option has an inert below-1 price multiplier). Real options going forward: (a) re-tune the `d`/`c` values for every affected lever option across all 11 types so the price effect can be added without breaking balance, a real rebalancing pass; (b) scope the price effect to apply only to non-default lever choices, so a business's starting price is never silently cut, a smaller and more contained change; (c) leave it dead code and just make sure the UI text doesn't overclaim (levText already skips the `p` modifier in its description, so this may already be adequately handled). This was originally part of option B (the big depth pass for abstract-revenue types) from the earlier audit, but turned out to affect the 11 goods/services types instead, so it is really its own item. Needs a decision with the user on which path, and likely needs Opus for the rebalancing option (a).
2. Decide whether/how to throttle the recurring `planShort` "can't afford next year's plan" prompt at its source (auto-production targeting via `autoQty`/`optPriceQty` ignoring affordability). Still open, see 3.6. Worth re-testing severity before deciding how much more work it needs, now that both the leftover-stock fix (3.5.13) and the credit-line cap/repay (3.5.27) may have already reduced how often it fires.
3. Decide whether the personal (non-business) debt floor is worth a design pass, now that the business-side equivalent (the credit line) has one. See 3.6.
4. Option B from the original business audit (big depth pass for the 6 abstract-revenue types: realty, tech, music/label, construction, gaming, lawfirm) and option C (per-industry flavor content) are both still on the table if the user wants to continue down the business-depth track. Needs Opus for option B (designing new systems); option C is more Sonnet-friendly (content work).
5. No other item is currently in progress otherwise. Pick the next backlog item with the user: candidates are item 4 (special-careers scaffold generalization) or resuming the fuller version of backlog item 6 (per-city population, Phase C/D from the original design, see the entry below).
6. **Big design discussion, 2026-09-27 (background, superseded).** The original heavy design for market size and geographic expansion (per-location population slices, Phase A-E) was mostly superseded by the lighter Awareness/Reach build (3.5.22) and then absorbed into the marketing funnel (3.5.23 onward), which now does real distribution math without a locations-list refactor. Still not built from that original plan: per-city population slices (today's model is whole-country), picking a specific city from a map for market-size purposes, true international expansion as a separate cost/risk tier beyond `cityCost`, and giving rivals real geography. If the user wants any of this, it is a genuine follow-up on top of the funnel, not a re-do.
7. Backlog item 4 (special-careers scaffold generalization) remains queued behind current business-system work.
