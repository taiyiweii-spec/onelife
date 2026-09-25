# One Life: Handoff

Updated 26 September 2026. Read this first. `docs/MASTER_NOTE.md` is the older full design note (parts of it are out of date where this file disagrees).

## What this is
One Life is a BitLife-style life simulator that runs in the browser. You live one life year by year from birth to death: school, jobs, relationships, money, investing, property and businesses, in 16 countries. When you die you can continue as one of your children (dynasty play). It is played as a published Claude artifact, and it also works as a plain web page.

- **Main public link: https://taiyiweii-spec.github.io/onelife/** (GitHub Pages, serves this branch, updates automatically within a minute or two of every push). AI features are off there because `window.claude` doesn't exist outside Claude.
- Claude artifact (AI features on): https://claude.ai/artifact/RLG41cydbEafzToL4TuZ1T, owned by the personal Claude account and shared as "anyone with the link". Only that account can republish it. The work (Beyond Insights) account has no edit rights and its own artifacts can't be shared publicly.
- The owner is not a programmer. Explain things in plain everyday language and give clear options with a recommendation.

## Tech stack
- One file: `index.html` (about 380 KB). Vanilla JavaScript, inline CSS, no framework, **no build step**. Keep it as one file.
- Google Fonts for type. Saves live in the browser's `localStorage` (3 slots, backup codes).
- Optional AI features (storyteller, obituary, investor pitch) use `window.claude.use('sample')`, which only exists inside a Claude artifact. Elsewhere the game carries on without AI.
- Test tools in `tools/` use Node plus jsdom. Browser screenshots use Playwright (Chromium).

## Run it locally
- **Play:** open `index.html` in a browser. Nothing to install.
- **Tests:** Node 18 or newer.
  ```
  npm install jsdom@24
  node tools/stress.js index.html 20 7      # robot plays full lives: file, lives, seed
  node tools/ceobot.js                      # owner-run vs great-CEO businesses, 12 years, flags bad CEO calls
  node tools/ceobot.js cafe,gym 2           # chosen business types, 2 seeds each
  node tools/loanbot.js 15 3                # personal loan checks plus random lives that borrow and repay
  ```
  `stress.js` must report `ERRORS 0`, `YEAR STEP ERRORS 0`, `BAD NUMBERS 0`. The same seed always gives the same fingerprint.
- **Syntax check after edits** (catches a missing bracket before anything else):
  ```
  node -e "const t=require('fs').readFileSync('index.html','utf8');const re=/<script[^>]*>([\s\S]*?)<\/script>/g;let m;while(m=re.exec(t)){new Function(m[1])}"
  ```
- **Environment variables:** none. No API keys or secrets anywhere.
- **Publish:** pushing to this branch updates the GitHub Pages link automatically. For the Claude artifact, use the Claude Artifact tool, `publish` with `file_path: index.html` and `url: https://claude.ai/artifact/RLG41cydbEafzToL4TuZ1T`. Read the live version first if that conversation has not published it. The `sample` capability carries forward. A different Claude account cannot update that URL unless it was shared with edit rights; otherwise publish a new artifact.

## How the code is organised (inside index.html)
- Game state is one object `S`. `newLife(o)` creates a life; `fillDefaults`/`migrate()` upgrade old saves (`SAVE_V=5`).
- The year runs as ordered phases (`YEAR_PHASES`): people, stats, work, business, property, events and so on. `simBiz(b)` runs one business year.
- **Replay dice:** every game roll uses `rnd()` (seeded). `Math.random()` is only used for new life codes and the AI storyteller's roll. Never add `Math.random()` to game logic.
- UI is built with the tiny helper `h(tag, props, ...kids)`. Sheets: `openSheet(drawFn)`, `drawSheet()`, popups via `choiceModal`, number pickers via `amountModal`, choices queued in `Q` and shown by `showNext()`.
- Countries: `COUNTRIES` (pay, rent, price level, taxes, volatility). `payF()`, `shopPrice()`, `tuition()`, `cty(b)`, `resC()`. Each country has its own economy (`S.cecon`, `localPhase()`, `bizPhase(b)`); `S.econ` is the world economy for stocks, crypto, bonds and savings.

## What has been built
- **Life:** careers with promotions, education, relationships, karma, 42 achievements, challenges, character creator, dynasties, moving abroad.
- **Character panel:** tap the stat bars. Karma, work ethic, fame, credit score (affects loan limits and rates) and skills (business, tech, people) with real effects.
- **Jobs:** yearly random openings, senior roles from your experience (`S.cexp`), up to 3 interviews a year with one question and 3 answers (`openings`, `applyJob`, `hireChance`).
- **Money tab:** Overview with a personal cash flow statement (income, expenses by month and year, net).
- **Personal bank loan** (Money, Overview, `loanModal`, `S.ploan`): one loan that can be topped up (blended into one balance, term resets). Limit = income x (1.5/1/0.6/0.3) + net worth excluding retirement x (30/20/10/5%) by credit tier (Excellent/Good/Fair/Poor, `PL_TIERS`); Bad credit, bankruptcy, under 18 or prison = no loan. Affordability: loan plus mortgage payments under 40% of income plus 5% of net worth. Terms 1, 3, 5 or 7 years, rate = `loanRate()` + tier add-on. Paid yearly in `plYear()` (inside `propertyYear`); a missed payment goes on the credit card and costs 50 credit points for 3 years. Counts in net worth, credit score and cash flow; bankruptcy wipes it; it's deducted from the estate on death. `S.ploan` only exists while there is a loan, so old saves and stress fingerprints are unchanged. Investing, Business, **Market** (homes and cars with areas, condition, yields, deal tags) and **My assets** tabs, Retirement.
- **Children live their own lives** (`kidLife`, `kidYear`): study, careers, dating, marriage, grandchildren, savings, investing, homes, small businesses, trouble. You influence them (suggestions accepted based on relationship, paying for university, approving partners, gifts). Continuing as a child keeps what they built.
- **Businesses:**
  - Products and services with one yearly demand, automatic production, suppliers, wholesale, rebrands, processing plants. Outlet capacity is shared between products (`baseCap`, `freeSpace`, `prodCap`).
  - Outlets: each new one earns 8% less than the one before (`OUTLET_DROP`), floor 20%. No "new city" expansion any more.
  - Sliders for number of outlets (Growth tab), staff and staff pay 70 to 150% (People tab).
  - Financials tab: headline figures, P&L with % of income, cash flow statement (verified by bot), 5-year history. Summary table across all businesses.
  - Funding: start-up funding screen, buying a business for sale with an acquisition loan or investors (`buyView`), for-sale listings include mid-size and chains priced on profit. Cash shortfall popups let you part-cover from several sources; production shortfall popup (`planShort`).
  - Co-owned businesses: lend to the company (`b.sl`) or buy new shares (shareholder vote). Board motions, shareholder-proposed motions (`shareholderMotion`), expansion approval, selling the whole company.
  - **Who runs it:** you (`b.life==='hands'`), a hired CEO (`b.ceo`), or nobody (neutral, no penalty). CEO stats: operations, sales, people, integrity, loyalty, plus personality. Owner sets a mandate (Grow, Balanced, Cut costs) and a spending limit.
  - **CEO decisions (`ceoManage`)**: products and services, growth and finance only. Strategy, marketing and all hiring stay with the owner (owner's decision). A stat of 80+ decides reliably (`skill()`). Weak CEOs cost money and can make costly mistakes. Loyalty affects quitting and poaching (counter-offer popup).

## In progress or known issues
- Nothing is half-built. All work is committed and published.
- Known rough edges:
  - The for-sale accounts (`saleFin`) can give big chains thin profits; those are effectively turnaround projects.
  - A CEO whose pay falls behind market (fair pay rises with revenue) may quit even with high loyalty. The owner must press "Match market pay".
  - One-off popup costs (fires, fines) land in the next year's cash flow statement because popups are answered after the report is made.
  - Children always stay in the parent's country; their business is a single value, not a managed business. Grandchildren only get full lives once they become your children.
  - Some old sections of `docs/MASTER_NOTE.md` describe an older base.

## Next tasks (priority order, all waiting on the owner's go-ahead)
1. Show buildings owned by businesses under My assets, and let their value follow the property market (proposed, not yet approved).
2. Business "Expand abroad" (branch in another country) or a country comparison on the Start a business screen (offered, owner to choose).
3. Make karma move with more choices (cheating, charity, firing people).
4. More realistic living costs (city-based rent, bigger homes cost more, children cost money to raise).
5. Optional: tune the 8% outlet drop, CEO strength and weak-CEO harshness after the owner plays more.

## Key decisions and why
- **One HTML file, no build step:** simple to share and publish as an artifact.
- **Replay dice:** bugs are repeatable, and a refactor can be proven harmless by comparing fingerprints.
- **Do not bring back "Skip 5 years".** Global financial assets (stocks, crypto, bonds, savings) stay global; countries have their own economies. Seasons were removed.
- **CEO scope:** products, growth and finance only, because CEOs making strategy and hiring decisions lost money in tests.
- **Businesses nobody runs are neutral**, at the owner's request.
- **Working agreement:** discuss and confirm any new design in plain language before building, give options with a recommendation, then build, test (stress bot, plus ceobot for CEO changes, plus a screenshot for UI), commit, push and publish. Be upfront about problems. No em dashes in game text. Money in US dollars.

## Before you change anything
- Make edits with exact-match replacements and run the syntax check afterwards.
- Run `tools/stress.js` (seed 7 and 42) before every publish. Run `tools/ceobot.js` after any CEO or business-economy change, and `tools/loanbot.js` after any personal money, credit or loan change.
- Keep all randomness on `rnd()`. Keep saves backward compatible: give new fields defaults (see `fillDefaults`, `ensureRunner`, getters like `hArea`, `carRun`).
- Wrap money moved inside a business with `cfAdd(b, key, amount)` (keys: prod, owner, invest, credit) so the cash flow statement stays correct.
- Development branch: `claude/peaceful-meitner-bz4tmp`. It has not been merged into the default branch.
