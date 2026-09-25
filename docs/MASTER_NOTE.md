# One Life: Master Note

A complete handover of the One Life game: what it is, how it is built, how every system works, what we changed, what is broken or thin, and how we will keep building. Paste this note (and attach the game file) into a new chat to continue exactly where we left off.

---

## 0. How to use this note in a new chat

1. Attach the latest game file, `One_Life.html` (single self-contained HTML file, about 280 KB).
2. Paste this whole note, or attach it as a file.
3. Tell the new chat: "Read the master note first. Follow the working agreements. We are continuing the block-by-block rebuild at the step listed in section 12."
4. Published artifact (David's account): https://claude.ai/artifact/QGZ1qDBmB5UwW614Z9KzMo
   - The new chat can update this same artifact by publishing with this URL, or read it back with the Artifact tool's read action.
   - Runtime capability declared on publish: `sample` (lets the page ask Claude for AI events, obituaries and investor pitches).

---

## 0.5 Current repo base (read this first)

The latest 280 KB `One_Life.html` described in this note could not be found. The repo now uses an older file instead: `index.html` in `taiyiweii-spec/onelife` (from `onelife-source.html`, 235 KB, 2,022 lines, save `S.v` 4).

What this base has, roughly up to change log item 8:
- Everything from the original game: life events, careers, investing, property, businesses, achievements, challenges, dynasties.
- Early product R&D and suppliers: catalogs, production plans, rebrand, retire, find a new supplier, seasons.
- Some business depth: headhunter, credit line, holding company, put cash in and take cash out, board seats for big investors, ousted CEO.

What this base does NOT have (must be rebuilt if still wanted):
- Phase 1: services model, factories, wholesale, spoilage, cash flow statement, outlet saturation and closing, calibration constants (PCAL, LABF).
- Phase 2: countries and country taxes, moving abroad, board confidence, named directors, voting, dividend policy, take private, market caps, price impact, activist investing.
- Several items from change log 3 to 7: the four named banks, training, team building, Founder life gating.

Sections 3 to 7 below still describe the lost 280 KB version. Treat them as the target design, not as what the code does today.

---

## 1. Working agreements (how David wants to work)

These rules came from David during the build. Follow them strictly.

1. **Clarify before committing.** Whenever David suggests a new change, walk through what it means and confirm the design before touching code. Quick fixes to something already agreed can be done directly. Anything new gets a discussion first.
2. **Concise, direct, decision-oriented.** Short explanations, clear options, ask at most a few focused questions (use tappable options where possible).
3. **Discuss design options before building.**
4. **Build in phases.** Large requests are split into phases and chunks, tested between chunks.
5. **Test before publishing.** Every change is syntax-checked and run in a headless browser test (see section 3.6). Balance changes are measured against the original game's numbers.
6. **Be upfront about mistakes.** If an edit fails or breaks something, say so plainly (this happened twice and was disclosed).
7. **Writing style inside the game and docs:** no em dashes, spell words out, plain language.
8. **Money is shown in US dollars** everywhere, even for foreign countries.
9. **Model choice:** Opus-class model for design and big builds, a lighter model for small fixes.

---

## 2. Game overview

One Life is a BitLife-style life simulator. You live one life year by year from birth to death, making choices about school, jobs, relationships, money, investing and businesses. When you die you can continue as your child (dynasty play).

The build focus so far has been a deep **business and money simulation**: products and services, supply chain, cash flow, governance, stock markets and countries with different tax systems.

Origin: the file came from another Claude account. It was re-published in David's account, then extended heavily in this chat.

---

## 3. Technical architecture

### 3.1 File and stack
- One file: `One_Life.html`. Vanilla JavaScript, no framework, no build step.
- Fonts from Google Fonts (Fredoka for headings, Nunito for body).
- All CSS and JS inline. Mobile-first layout, max width 560px, light and dark themes via CSS variables on `:root` (with `prefers-color-scheme` and `data-theme` overrides).
- Safe-area padding for phones (`viewport-fit=cover`).

### 3.2 Core runtime objects
| Object | What it holds |
|---|---|
| `S` | The whole current life (the save). Character, stats, money, relationships, jobs, businesses, investments, flags, log. Saved to `localStorage` key `onelife-save-v3`. Current `S.v` is 4. |
| `META` | Cross-life data: achievements, family tree, hall of fame, company history, settings (sound, AI toggle). Key `onelife-meta`. |
| `Q` | Queue of pending decision events (choice popups). **Not saved** (known bug, section 11). |
| `launch` | Temporary state for the business launch screen. |
| `bizView`, `bTab` | Which business and tab is open. |
| `curSheet`, `flash` | UI sheet state and flash message. |

### 3.3 UI building blocks (helpers)
- `h(tag, props, ...children)`: DOM builder used everywhere.
- `row(title, sub, right, fn, disabled, energyCost)`: standard tappable row. Energy cost auto-spends on tap.
- `seg(options, current, fn)`: segmented control.
- `tog(label, sub, on, fn, disabled)`: toggle row.
- `openSheet(builder)` / `drawSheet()` / `closeSheet()`: bottom sheets.
- `choiceModal(title, text, choices, extraEl)`: modal with buttons. Choices are `[label, fn, disabledFn, traitTag]`.
- `amountModal({title, sub, min, max, init, btn, note, onOk, step, fmtA})`: slider plus typed number plus quick chips. `fmtA` formats non-money units (shares).
- `stay(msg, cls)`: log a line, save, re-render, then show the next queued event.
- `line(text, cls)`: add a line to this year's log. `mile(text)`: milestone.
- `chartEl(data)`: small SVG line chart from `[{age, nw}]`.
- `fmt(n)` money, `fmtP(p)` price, `fmtN(n)` whole number with commas, `pct(n)` signed percent.
- `R(a,b)` random int, `pick(arr)`, `wpick(arr, weightFn)`, `gauss()`, `clamp(v)` (0 to 100).

### 3.4 Main screens
Header (name, age, city, cash, energy, menu) and a scrolling life log. Bottom buttons: Age up, Job, Money, People, Activities, Menu. Money sheet tabs: Overview, Investing, Property, Retirement, Business. Each business opens its own view with tabs: Overview, Products or Services (goods and service types only), Strategy, People, Growth, Finance, Risk.

### 3.5 Publishing rules (artifact runtime)
- Published pages cannot call the Anthropic API directly. AI uses `await window.claude.use('sample')`, which returns `null` if unavailable. The code already handles `null`.
- `localStorage` works in published pages (per viewer, per artifact).
- Publish: copy file to `/mnt/user-data/outputs/One_Life.html`, then Artifact tool `publish` with `file_path` and `url` of the existing artifact, favicon 🌱, capabilities `{sample:{}}` (can be omitted on republish to carry forward).

### 3.6 How we test (keep doing this)
- Syntax: extract the script with Node and `new Function(scriptText)`.
- Headless play: `jsdom` harness loads the HTML with `runScripts:'dangerously'`, then calls game functions via `window.eval` (for example `newLife`, `newBiz`, `simBiz`, `bizYear`, `econYear`, `drawBiz`, and clicks modal buttons).
- Deterministic balance runs: override `Math.random` with a seeded generator, run 8 to 20 simulated years or businesses, and average results.
- Always keep a backup copy before large edits.
- Edits are applied with Python string replacement that asserts each target appears exactly once (prevents silent mis-edits).

---

## 4. Architecture: the building blocks

Five layers. Each block depends on the layers below it.

| Layer | Blocks | Status |
|---|---|---|
| **Meta** | Story and events, Legacy, Progression, UI shell | Story: works but thin across life stages. Legacy: basic. Progression: solid. UI shell: getting crowded. |
| **Business** | Business core, Products and services, Competition, Governance | Core: deep. Products: deep, new. Competition: thin. Governance: deep, new. |
| **Money** | Personal finance, Assets, Investing | Personal finance: patchy. Assets: basic. Investing: works, UI is one messy list. |
| **Life** | Character, People, Education and jobs | Character: solid. People: thin. Education and jobs: solid. |
| **World** | Time engine, Countries, Economy and markets | Time: solid. Countries: new v1 (one global economy). Economy: solid. |

---

## 5. Block by block: how every system works today

### 5.1 World layer

#### Time engine
- One turn is one year: `ageUp()`. Order inside a year: age everyone, relationship decay and deaths, personal stat drift, school milestones, `econYear()`, education, `workYear()`, pension, side gig, `bizYear()` (all businesses), angel investments, `propertyYear()`, normalise stats, `queueEvents()` (random events), net worth history, decade review, `checkDeath()`.
- Under 18 or in prison, business decisions are auto-made ("my trustee" or "my lawyer" chose the first allowed option).
- `skipYears(n)` runs several years quietly and stops if a decision is queued.
- Energy: 2 (under 6), 3 (under 12), then 5 base, adjusted by traits, job style, age 75+, and hands-on businesses. Reset each year.
- `S.used` tracks once-per-year actions and resets each year.
- Death chance rises after 55 and with health under 15; certain at health 0 or age 115.

#### Countries (new, Phase 2)
16 countries, 33 cities, stored in `COUNTRIES`. The city string format is `"City, Country"`. Residence country comes from `S.city`. Each business stores `b.cty` (country at founding). Businesses from older saves have no `cty` and use neutral price and cost levels (factor 1) with residence taxes.

| Key | Country | Price level (pp) | Wages | Rent | Company tax (small, main, threshold) | Dividend tax | Notes |
|---|---|---|---|---|---|---|---|
| us | USA | 1.00 | 1.00 | 1.00 | 21% flat | 15% | Austin, Portland, Chicago |
| uk | UK | 0.95 | 0.90 | 1.05 | 19% to $50k, then 25% | 25% | Leeds, Glasgow, London |
| ca | Canada | 0.90 | 0.85 | 0.95 | 12% to $500k, then 26% | 25% | Toronto, Vancouver |
| au | Australia | 1.00 | 1.10 | 1.10 | 25% to $5M, then 30% | 30% | Melbourne, Sydney |
| nz | New Zealand | 0.90 | 0.85 | 1.00 | 28% flat | 20% | Auckland, Wellington (kept for old saves) |
| ie | Ireland | 1.00 | 0.95 | 1.20 | 12.5% flat | 40% | Dublin, Cork |
| de | Germany | 0.95 | 1.00 | 0.95 | 30% flat | 26% | Berlin, Munich. Heavy red tape, strong unions |
| ch | Switzerland | 1.50 | 1.40 | 1.35 | 14% flat | 20% | Zurich, Geneva. Stable |
| ae | UAE | 1.10 | 0.90 | 1.30 | 0% to $100k, then 9% | 0% | Dubai, Abu Dhabi. No income tax |
| ng | Nigeria | 0.35 | 0.25 | 0.45 | 0% to $60k, then 30% | 10% | Lagos, Abuja. Volatile, high interest, high corruption |
| za | South Africa | 0.55 | 0.45 | 0.60 | 27% flat | 20% | Cape Town, Johannesburg |
| in | India | 0.30 | 0.20 | 0.35 | 25% flat | 30% | Mumbai, Bengaluru. Fast growth, red tape |
| jp | Japan | 0.90 | 0.80 | 0.90 | 30% flat | 20% | Tokyo, Osaka. Low rates, slow growth |
| sg | Singapore | 1.20 | 1.10 | 1.50 | 8.5% to $150k, then 17% | 0% | Easy to do business |
| my | Malaysia | 0.45 | 0.35 | 0.45 | 17% to $130k, then 24% | 2% | Kuala Lumpur, Penang |
| ph | Philippines | 0.35 | 0.25 | 0.40 | 20% to $90k, then 25% | 10% | Manila, Cebu |

Each country also has: income tax brackets (`inc`), loan-rate add-on (`rate`), economic volatility (`vol`), growth (`grow`), red tape (`red`), corruption (`corrupt`), union strength (`union`), market depth (`pop`). Rates are simplified, inspired by real systems, not exact law.

Where countries apply:
- **Prices:** suggested product price = base price times `pp`. Unit cost scales by `0.25 + 0.75 x pp`. Volume scales by `pp^-0.15` (poorer markets sell a bit more volume).
- **Costs:** wages times country wage factor, rent and factory running costs times rent factor, cost of living times `0.4 + 0.6 x rent`.
- **Startup capital:** `BIZ.cost x (0.4 + 0.6 x rent) x (0.85 + 0.15 x red)` plus working capital.
- **Outlet and factory build cost:** scaled by rent and red tape.
- **Loans:** base rate by economy phase plus country `rate`.
- **Economy:** business demand swing times `vol`; business growth multiplier `b.gm` grows by `(grow - 1) x 3%` a year, capped at 2x.
- **Saturation:** outlet saturation base `1 - 0.12 / pop`.
- **Unions:** union drive chance times `union`.
- **Corruption:** weighted "processing fee" event (pay, refuse, report).
- **Taxes:** `incomeTax(gross)` progressive brackets, `netPay(gross)`, `corpTax(b, profit)` banded (also multiplied by lobbying/regulation adjustment `S.regs.tax / 0.2`), `divTax()` residence dividend rate.
- **Moving:** Activities, "Where I live", `moveSheet()`. Costs about $8,000 x destination rent factor. You lose your job, non-family relationships drop 10, happiness drops 4. Businesses stay in their founding country; hands-on ones switch to delegate.

#### Economy and markets
- Global phases: boom, normal, recession, crash, with transition odds (`econYear`). Affects stock returns, loan rates, business demand, home prices.
- Tickers (`TICK`) with market caps (`TCAP`):

| Ticker | Name | Type | Market cap | Notes |
|---|---|---|---|---|
| MKT | Broad Market Index | Index fund | unlimited | No price impact |
| NMBS | Nimbus Tech | Stock | $300B | High beta |
| HRVS | Harvest Foods | Stock | $40B | Defensive |
| MRDN | Meridian Bank | Stock | $80B | |
| PXBX | Pixelbox Games | Stock | $15B | |
| VLTR | Voltra Motors | Stock | $20B | Very volatile |
| GLOW | Glowcap Mining | Penny stock | $20M | Can go bankrupt |
| BYTE | Byteon | Crypto | $800B | Wild swings |
| PAWS | Moonpaw Coin | Meme coin | $50M | Usually loses, rare explosion |
| BOND | Government Bonds | Bonds | unlimited | Fixed 4% |
| SAVE | High-Yield Savings | Savings | unlimited | Fixed 2% |

- Shares outstanding = cap / starting price. Tradeable float = 85% for stocks and penny stocks, 100% for coins.
- **Price impact:** trading n shares moves price by `k x n / float` (k = 1.5 stocks, 2 penny, 1.2 crypto, 2 meme). Buys fill at average price `p x (1 + impact/2)`, sells at `p x (1 - impact/2)`. Max holding 95% of float.
- **Activist investing:** crossing 5% of a stock or penny stock is publicly disclosed (+3% price). Once a year, 1 energy, fee about 0.5% of position (min $50k): push buyback (+5 to 15%), push sale (+20 to 35%), or demand new CEO (random swing). Odds rise with stake and fame.
- Price history stored per ticker (`q.h`, last 40 years).
- Home price index `S.homeIdx` moves with the economy.

### 5.2 Life layer

#### Character
- Stats 0 to 100: happiness, health, smarts, looks. Traits (2 to 3 per life, one can be inherited): Ambitious, Lazy, Charming, Genius, Athletic, Reckless, Frugal, Big spender, Lucky, Anxious, Creative, Hothead, Kind, Hustler.
- Fame 0 to 100 (founder fame) from business success, events, going public.
- Criminal record, prison years, flags for many life facts.
- AI storyteller uses `lifeFacts()` to describe the player.

#### People (thin, next big rebuild)
- `S.rels` holds Mother, Father, Sibling, Partner, Spouse, Child, Pet. Each has name, age, gender, relationship 0 to 100, alive flag.
- Relationships decay 0 to 4 per year. Older people and pets can die. Partners with low relationship may leave.
- Find love (Activities): one random person, success chance from looks and Charming. Adoption (age 25+): $15,000, always succeeds.
- `S.mem` stores a few remembered people (bully, crush) used for rivals and events.
- Co-founders at launch: partner, sibling, or a random "old friend" who can invest up to half the capital regardless of your experience (a flagged problem).

#### Education and jobs
- School milestones; high school graduation needs smarts 15+.
- Majors: Fine Arts, Education, Business, Nursing, Computer Science (4 years each), graduate MBA (2), Law (3), Medicine (4). Tuition $18,000 a year to student loans unless on scholarship.
- 16 careers: Fast food, Retail, Coffee shop, Warehouse, Delivery, Office admin, Electrical trade, Police, Education, Nursing, Design, Marketing, Finance, Software, Law, Medicine. Levels, performance, promotions, raises, bonuses, layoffs by economy, work style (slack, normal, hustle).
- Retirement at 60+ (public sector pension 50% of salary).

### 5.3 Money layer

#### Personal finance
- Cash can go negative (credit card debt, 7% a year). Student loans. Living costs by home ownership, traits and country.
- Salary and bonuses taxed with country income tax brackets (`netPay`).
- Retirement account: contribution 0, 5, 10 or 15% of salary (job or business salary). Employer or your business matches half, up to 5%. Grows with the market index. Withdraw early (30% loss) or after 60 (20% tax).
- Net worth = cash - student loans + investments + retirement + property equity + business stakes + angel investments.

#### Assets
- Shop: Used hatchback $5,500, Family sedan $26,000, Electric SUV $58,000, Sports coupe $115,000, Studio apartment $165,000, Townhouse $340,000, Lakeside house $780,000, Hilltop mansion $3.4M.
- Mortgages, renting out homes, home values follow `S.homeIdx`.

#### Investing
- Every investment opens a detail screen: price history chart, price per share, market value and tradeable shares (where limited), shares owned and % of company, value, gain or loss.
- Buy by dollar amount (slider or typed), sell a chosen number of shares, or sell all. Previews show price impact and resulting stake.
- Own listed companies appear too (see Governance) with fundamentals and technicals.
- Angel investments (small stakes in startups that resolve after 4 years).
- Known problem: all investments are one long list (planned split into tabs: Stocks, Funds and bonds, Crypto, Savings, My companies).

### 5.4 Business layer

#### Business core
- 17 industry types exist; **11 are startable**: food truck, cafe, restaurant, bar, farm, clothing brand, car dealership (goods), gym, salon, hotel, private clinic (services, clinic needs a Medicine degree). **Hidden** from start and for-sale lists: law firm, real estate agency, construction, tech startup, record label, game studio (still run for old saves on the old generic model).
- Up to 5 businesses at once.
- **Launch screen:** choose capital (minimum = setup + starting cash; product and service businesses also include working capital for the first product's R&D plus about a year of stock), fund it with own cash, startup bank loan, co-founder (partner, sibling, old friend), or investors via a pitch. Money above the minimum becomes extra business cash.
- **Management style:** hands-on (quality +10, costs energy, happiness and health), delegate (needs a manager), hands-off.
- **Staff:** regular staff auto-hired to need (goods: `BIZ.staff x outlets`, services: labor-based). Pay level low, market or high affects morale.
- **Key people:** roles Manager (runs the business when you are not hands-on, covers 4 outlets each), Specialist (raises quality, up to +25 together), Star (lifts sales, up to +20% together, costs 30% more). Team cap `4 + 2 x (outlets - 1) + 1 per $5M revenue`, max 20. Pool of 6 candidates a year, headhunter refresh (skill 55 to 95). Per-person Train (40% of wage, +6 to 14 skill), raises, firing. Passive skill growth when morale is 55+. Team building day (morale +10, chance of skill bumps). List scrolls after 6 people.
- **Morale** (0 to 100): drifts toward 60; pay, unions, hands-on nudge it; below 60 drags quality; low morale causes union drives, strikes, bad reviews.
- **Quality and reputation:** quality from supplier quality, team, morale, management; reputation drifts toward quality and reacts to events.
- **Outlets:** open as many as cash allows. Each outlet cost `BIZ.cost x 1.1 x zoning x country factors`. Saturation: each extra outlet in the same city earns less; new city resets it (needs 3+ outlets and 60% reputation). Close an outlet recovers 15% of cost.
- **Loans:** 4 banks (Main Street Bank standard, Summit Capital cheapest but picky, Harbor Credit Union smaller loans, QuickFund Lenders anyone but very high interest), terms 3, 5, 7 or 10 years. Credit line after 1 year (10% interest, auto-covers shortfalls).
- **Investors:** raise money with a pitch (AI investor asks a question and scores your typed answer, or quick answers). IPO needs $5M value and 3 years.
- **Owner salary:** fair pay from revenue: 12% up to $1M, then 4% up to $28M, then 0.8% above, floor $35k, max $20M, scaled by management role (1.0, 0.8, 0.35). Ceiling 1.5x fair pay times governance cap multiplier.
- **Deposit and withdraw:** deposits untaxed. Withdrawals are dividends to all owners by stake, your share taxed at your country's dividend rate.
- **Cash flow statement** (Finance tab): opening cash, sales, operating costs, production and stock paid, loan payments and interest, tax, deposits minus withdrawals and dividends, investments, credit draws and other, closing cash. Verified to balance to the dollar.
- **Holding company:** form with 2+ businesses; move cash between them; 10% business tax cut.
- **Ousted CEO:** operational decisions are hidden and logged as the new CEO's problem; shareholder decisions still reach you.

#### Products and services (Phase 1)
Applies to the 11 startable types. A new business starts with no products and no sales.

- **Catalogs** (international mix):
  - Food truck: tacos, burgers, kebab wraps, ice cream, hot dogs, churros, ramen bowls, loaded fries
  - Cafe: espresso drinks, iced coffee, bubble tea, croissants, matcha latte, cheesecake, hot chocolate, smoothies
  - Restaurant: pizza, sushi, steak, pasta, ramen, tacos al pastor, dim sum, curry, paella
  - Bar: craft beer, cocktails, wine, whisky, mocktails, bar snacks, sake
  - Clothing: hoodies, jeans, sneakers, T-shirts, jackets, swimwear, dresses, caps
  - Dealership: compact cars, SUVs, electric cars, pickups, sports cars, minivans, motorbikes
  - Farm: wheat, corn, tomatoes, apples, strawberries, wine grapes, soybeans, honey
  - Gym: memberships, personal training, group classes, yoga, swim lessons, nutrition coaching
  - Salon: haircuts, colouring, nails, facials, bridal packages, barber shaves
  - Hotel: standard rooms, deluxe rooms, suites, event hall, spa, breakfast buffet
  - Clinic: GP visits, health screenings, dental, physiotherapy, vaccinations, dermatology
- Each item: suggested price, cost ratio (normalised so each type's average equals its original cost of goods), demand score, competition score, seasonal pattern (spring, summer, autumn, winter), perishable flag (goods) or labor intensity and unit label (services).
- **R&D:** pick a product, see demand and competition bars, pay R&D (`cost x (0.04 + demand x 0.001) x (1 + (100 - competition)/200)`), ready immediately; the production plan opens straight away.
- **Production plan:** price slider (0.3x to 3x suggested, with "use suggested price"), quantity slider or typed (with "match expected demand"). Shows cost per unit, expected demand, production or space limit, stock on hand, plan cost, available capital after this plan, rough profit. Services show staff needed and wages.
- **Cash:** the plan is paid up front from business cash, then the credit line. One shared pool across products. Available capital = business cash + unused credit line. Plans renew automatically each year; if unaffordable they scale down with a log line. Retiring refunds the unused plan payment.
- **Demand per product:** `BIZ.base x demand x (1 - competition/250) / PREF[type] x 1.1 x PCAL[type] / basePrice x spread x volume factor x effective outlets x common multiplier x rating factor x price factor x rebrand boost`.
  - Price factor `(price / suggested)^-1.6`, clamped.
  - Spread `1 / (1 + 0.35 x (products - 1))` (products share the customer base).
  - Rating factor `0.8 + rating/250`.
  - Common multiplier includes growth, economy, reputation, quality, marketing, trends, rivals, synergies, fame, stars, noise, weather, staffing, strikes.
- **Seasons:** one annual plan; stock arrives evenly each season (made/4). Perishable goods spoil at each season's end. Non-perishable carries over with 5% storage cost. Services: unused capacity is lost.
- **Suppliers:** each product has a supplier with cost multiplier, quality and reliability. Up to 3 searches per product per year, each showing one random supplier to accept or skip. Low reliability can halve a season's delivery (refund for the missing half).
- **Capacity:** each outlet can make 1.5x its typical sales (services: space for 2x). Factories (central kitchen, garment factory, processing plant, regional distribution hub), up to 3, cost `1.5 x BIZ.cost` (scaled by country) and `1.5 x fixed` a year to run; each adds 4x typical capacity; factory units about 12% cheaper plus 3% shipping.
- **Wholesale:** with a factory, per product toggle sells extra stock to retailers at 60% of suggested price, up to 0.6 x factory capacity a year, before spoiling or piling up.
- **Services:** capacity instead of quantity; staff needed = sum of capacity / units per staff (`(base / staff) / price / labor intensity x LABF`); wages are the main cost.
- **Product actions:** production plan, find new supplier, wholesale toggle, rebrand (30% of R&D, +20% demand fading 5% a year, once a year), retire.
- **Slots:** 3 + 1 per 2 extra outlets, max 8.
- **Calibration constants:** `PCAL = {dealership:0.6, farm:1.3, gym:1.13, salon:1.05, hotel:0.6, clinic:1.12}`, `LABF = {gym:1.3, salon:1.15, hotel:1, clinic:1.2}`. Calibrated so a single-product business earns close to the original game's profit for that type.
- Old saves: each goods or service business gets a starter product.

#### Competition
- Rivals: spawn near your businesses (sometimes run by your ex, bully, crush or sibling) with a strategy (budget chain, trendy boutique, premium, aggressive) and a strength number. They hurt more when your price tier overlaps theirs. They can start price wars, poach staff, or offer to buy you. Weak rivals can be bought (adds an outlet).
- Trends (plant-based, retro, AI, wellness, travel, housing) boost certain types for 3 to 5 years; you can "ride the trend".
- Regulations: minimum wage, food tax, corporate tax changes, delivery fees, zoning.
- For-sale market: 4 businesses a year, up to 2 matching types you own. Same type can be **merged** into your business (paid from its cash first, needs acquisition approval if you do not control the board): outlets join, reputation blends by outlet count, morale -5.
- Contracts: corporate (2 years) and government (4 years, some types) with win chance shown up front and three bid styles (undercut, standard, premium).
- Known gap: rivals are just a strength number, not real companies with people.

#### Governance (Phase 2)
- Applies when outside owners (co-founder or investors) hold 1% or more.
- **Voting power** = share ownership (one share, one vote).
- **Tiers:** sole owner (no board), minority (under 25%), board seat (25 to 50%), control (over 50%: cannot be removed, motions pass), supermajority (over 75%: take private, sell or merge freely).
- **Board:** 5 seats (7 when public). Seats split by D'Hondt proportional allocation, one independent seat; majority owner gets `floor(n/2)+1`. Winning a shareholder vote sets `gov.mine` (your nominees' seat count).
- **Directors** are named characters with loyalty, greed, risk-taking, independence. Your nominees vote with you (92%). Co-founder votes by relationship. Investor and independent directors vote by board confidence and traits relevant to the motion.
- **Board confidence** 0 to 100, starts at 60. Yearly: profit growth up to ±8, sales growth ±4, reputation ±4, loss year -6, scandal (reputation drop of 10+) -8, pay above market -5, dividends +2 or +3, share price ±5, drift toward 55. Reasons listed.
- **Removal:** warning under 40. If you own 50% or less and confidence stays under 25 for 2 years, the board votes. Majority owner is reinstated automatically.
- **Board meeting** (once a year, 1 energy): reinstate me as CEO, raise pay cap (+50%, max 2x), share buyback (public, up to 10% of value, shares cancelled so your stake rises), raise or cut dividend, approve acquisition budget (2 years), adopt takeover defence (cuts raid chance, lets board seats block raids).
- **Shareholder vote** (once a year, 1 energy): elect my nominees; public turnout 60%; investors side with you by confidence and fame; co-founder by relationship. Winning gives you a board majority and reinstates you if ousted.
- **Dividend policy:** 0, 25, 50 or 75% of after-tax profit, paid yearly to all owners, your share taxed at your country's rate. Set directly if sole or controlling, else by board vote.
- **Take private:** supermajority of a public company can buy out the rest at a 30% premium.
- **Own listed company shares:** 10,000,000 shares; price = company value / shares. Price moves with the market, fundamentals (profit growth, reputation, losses) and momentum. Buying pushes the price up, selling pushes it down. Keep at least 1%. Shows fundamentals (revenue, profit, growth, P/E, reputation) and technicals (1 and 5 year change, trend versus 5-year average, momentum). Under 40% invites takeover raids.

### 5.5 Meta layer

#### Story and events
- 81 life events (`EVENTS`, age-gated, with choices and trait-specific options), business events (viral, lawsuits, fires, break-ins, floods, health inspections, recalls, audits, landlord, hacks, sweatshop exposure, angry video, star employee equity demand, price wars, poaching, rival buyout offers, corruption), decade reviews, reviews from customers.
- **AI storyteller** (toggle in menu): sometimes writes a custom event from your life facts. AI obituary on death. AI investor pitch. All via the `sample` capability, uses the viewer's Claude usage.

#### Legacy
- On death: obituary, company histories saved to META, continue as a child (`continueAs`): estate = 85% of liquid wealth split evenly among heirs, assets and family businesses pass on, one trait can be inherited, generation counter increases. Family tree and hall of fame in META.
- Known gap: no will, no chosen heirs, no estate tax brackets, no inheritance from parents.

#### Progression
- 42 achievements (for example Millionaire, Deca-millionaire, Billionaire, IPO, exit, takeover defence, meme lord, angel, award).
- 8 challenges: Food truck to empire, Unicorn hunt, Crash-proof, Serial founder, Three industries, Family business, Phoenix, Rags to riches.
- **Founder fame** unlocks "Founder life" in Activities at 5%: paid speaking gig (15%+, shows pay range $2,000 to $2,000 + fame x $1,000), write a business book (30%), pitch on "Founder Pit" TV, guest judge (60%), mentor a young founder (needs a business run 3+ years), lobby politicians (risky).

#### UI shell
- Sheets and modals as in section 3.3. Screens are getting crowded; the Investing list needs tabs; business tabs are dense.

---

## 6. Change log (what we built in this chat, in order)

1. Re-published the imported game in David's account with AI enabled.
2. Ousted CEOs no longer get operational decisions; speaking gig shows pay.
3. Outlets: open many (cash-limited), saturation, manager coverage, close outlets.
4. Banks with terms, retirement from business salary, key people cap removed and roles explained, bigger hiring pool, headhunter, same-type acquisitions, contract odds shown with bid styles, stock detail screens with charts and share sliders, own-company fundamentals and technicals.
5. Removed cash moving (later brought back with tax), majority owners cannot be ousted, buyback overbuy bug fixed, scrollable team list, training, passive skill growth, team building.
6. Salary cap scaling for large revenue (curve above $28M).
7. Founder activities moved to Activities, gated by 5% fame.
8. Product R&D system for goods businesses (catalogs, demand and competition, price and quantity plans, seasons, spoilage, inventory, suppliers, rebrand, retire), target customer segment removed, deposit and taxed withdrawal, buybacks lift price.
9. **Phase 1:** hid 6 industries, services model for gym, salon, hotel, clinic; supplier search; up-front plan payments and shared capital; cash flow statement; outlet capacity; factories; wholesale; startup working capital; service calibration.
10. **Phase 2:** 16 countries with taxes, prices, costs, rules, moving abroad; income and dividend tax by country; board confidence; named directors; voting power; board and shareholder votes; dividend policy; take private; market caps, float limits, price impact; activist investing.
11. Architecture review: building blocks defined, missing systems identified, people stats model proposed.
12. Moved to a GitHub repo (`taiyiweii-spec/onelife`). The 280 KB file was lost, so the base is now `onelife-source.html` (see section 0.5).
13. Added `tools/stress.js`, a jsdom harness that auto-plays full lives with a seeded random generator (section 12.3 results).

---

## 7. Key balance references (for recalibration)

Original year-one profit (one location, normal economy) that product and service businesses were calibrated against:

| Type | Original profit | After product system (1 product) |
|---|---|---|
| Food truck | $18k | about break-even |
| Cafe | $23k | $11k to $34k |
| Restaurant | $63k | $12k to $70k |
| Bar | $80k | about $110k |
| Clothing | $7k | $9k to $16k |
| Car dealership | -$113k | loss in year 1 (slow starter; stock is expensed when paid) |
| Farm | $131k | about $90k |
| Gym | $95k | about $85k to $93k |
| Salon | $13.5k | $3k to $13.5k |
| Hotel | $332k | about $307k to $345k |
| Clinic | $124k | about $119k to $154k |

Country cafe check (one product, normal year): US about $37k, UK $41k, Malaysia $31k, Singapore $33k, UAE $58k, Nigeria about $5k (tough market), Switzerland about $28k.

---

## 8. Proposed People stats model (agreed direction, not built)

One shared model for every character, including the player.

| Group | Stats | Drives |
|---|---|---|
| Core | Happiness, health, smarts, looks | Same as the player today |
| Personality | Openness, discipline, sociability, kindness, volatility ("craziness") | How they behave, drama, impulsive choices |
| Values | Ambition, greed, loyalty, honesty, risk appetite, generosity | Investing, betrayal, competition, loans, gifts |
| Luck | Hidden luck | Windfalls and disasters in their own lives |
| Situation | Age, job, education, net worth, income, city, marital status, children, fame | Who they are; their lives progress yearly |
| Relationship with you | Closeness, trust, respect, attraction, resentment, money owed, shared memories | Tracked per relationship |

Behaviour rules example: friend investment chance = openness + trust in you + their net worth + your track record; betrayal risk rises with greed and low loyalty.

Planned People features (from David's list):
- Adoption: choose from 3 candidates; approval depends on money, age, marriage, happiness, criminal record.
- Finding a partner: choose from 3 candidates; success depends on looks, charm, wealth, age gap, their standards.
- Friends list: about 25 characters in your city with net worth and traits; hang out, ask for loans or investment, co-found. Investment capped by their net worth, openness and your track record (no millions for a beginner).
- Directors, investors, rivals and heirs later draw from the same character system.

---

## 9. Missing systems to add for a great life sim

- **Skills:** negotiation, management, finance, charisma, a trade; grow with practice.
- **Life goals:** chosen aspirations with milestones.
- **Memory and consequences:** people remember what you did, system-wide.
- **Time and era:** calendar years, inflation, world events (tech shifts, pandemics, bubbles).
- **Health and ageing depth:** lifestyle, fitness, work stress.
- **Reputation beyond business:** public image and social standing.
- **Balance simulator:** auto-play hundreds of lives and report problems.
- **Pacing by life stage:** more choices in childhood, teens and old age.
- **Replayability:** starting scenarios, difficulty, rare events.
- **Clarity:** light tutorial and a year-end recap.

---

## 10. Pending decisions from earlier phases (still open)

- **Phase 3 (People):** adoption and partner choice, friends list with traits. Design to be confirmed.
- **Phase 4:** investing tabs (Stocks, Funds and bonds, Crypto, Savings, My companies) and inheritance (will, chosen heirs and shares, charity, estate tax brackets, named business successor, inheriting from parents and relatives).
- **Startup capital decision:** the minimum now includes first-year working capital. David can switch back to old minimums (players deposit or borrow instead).
- **Roadmap additions:** which of Skills, Life goals, Memory and consequences, Time and era should join the plan (question asked, not yet answered).

---

## 11. Known issues and tech debt

| Issue | Impact | Fix idea |
|---|---|---|
| Pending decisions queue `Q` is not saved | Closing the game with a decision pending loses it (for example a cash shortfall event), leaving the business in a bad state | Store `Q` as data in `S` (event id plus parameters), rebuild on load |
| Load only accepts `S.v` 3 or 4 | A future version number would wipe the save and start a new life | Proper versioned migration chain; never discard unknown versions |
| New fields added lazily with `||` defaults | Fragile; hard to know a save's shape | Migration step per version that fills defaults |
| Save errors are silently ignored | If storage fills up, progress is lost without warning | Warn the player; trim logs; measure save size |
| Single save slot, no export or import | Cannot back up or share a life | Export and import save as text or file |
| `ageUp` is one long function | Order is hard-coded, hard to extend | Split into ordered yearly phases per block |
| One global economy | Countries differ only by volatility and growth multipliers | Per-country cycles or regional shocks |
| No inflation or calendar year | Prices never change over a lifetime | Era and inflation system |
| Hidden industries still on old model | Old saves only | Rebuild with their own mechanics later (projects, launches) |
| Car dealership year-one loss | Slow starter by design; stock expensed when paid | Consider inventory as an asset on the books |
| Friend co-founder can invest huge sums | Unrealistic for beginners | People rebuild |
| Investing list is long | Messy UI | Investing tabs |

---

## 12. How we continue building (the plan)

### 12.1 Method for every block
For each block, in order:
1. **Audit:** read the actual code, list real problems, run a headless stress test.
2. **Propose:** a short spec (purpose, rules, data, screens, links to other blocks), with options.
3. **Confirm with David** before building.
4. **Build** in chunks, with Python edits that assert unique matches.
5. **Test:** syntax check, headless play, balance runs against reference numbers, old-save compatibility.
6. **Publish** to the same artifact URL and summarise briefly.
7. **Update this master note** (change log, known issues, pending decisions).

### 12.2 Build order (agreed direction)
1. **Time engine audit and foundations clean-up** (in progress, we were about to start). Planned stress test: auto-play full 80-year lives with businesses, auto-resolve every decision, measure crashes, save size and speed. Then fix: save the event queue, versioned migrations, save-size guard, export and import, split `ageUp` into ordered yearly phases, organise code into block sections.
2. **People** with the shared character stats model (section 8), adoption and partner choice, friends list, and co-founder or investor limits.
3. **Story and events** reacting to people's stats; memory and consequences.
4. **Countries v2:** per-country economies, inflation and calendar years.
5. **Personal finance and Investing:** loans, credit, investing tabs.
6. **Competition:** rivals as real companies run by real people.
7. **Legacy:** wills, heirs, estate tax, family wealth.
8. **UI shell:** simplify screens once features are settled.

Also to schedule: Skills, Life goals, Health and ageing, Reputation, Balance simulator, pacing, replayability, tutorial and year-end recap.

### 12.3 Immediate next step
Stress test done on the repo base (75 lives, about 4,000 years, 3 seeds; the bot studies, works, dates, has children, invests, buys homes, launches up to 3 businesses, taps random activities, answers every event at random, and opens every screen and business tab each decade):
- No crashes, no NaN or infinite numbers, no stuck events, save round-trips every year.
- Speed: a year takes about 0.3 ms (95% under 0.9 ms, worst about 36 ms).
- Save size: average about 12 KB, largest about 43 KB. META about 30 KB after 25 lives (family tree capped at 200 entries).
- Known foundation issues from section 11 are still present in the code: the event queue `Q` is not saved; load starts a new life for any version other than 3 or 4; save errors are ignored; one save slot, no export; `ageUp` is one long function.

Next: propose the foundations clean-up spec for David to confirm before building.

### 12.4 Starter prompt for the new chat
"Here is One_Life.html and the One Life master note. Read the note fully first and follow the working agreements in section 1. We are at section 12.3: run the Time engine stress test, report what you find, then propose the foundations clean-up for me to confirm before building. Publish updates to https://claude.ai/artifact/QGZ1qDBmB5UwW614Z9KzMo."
