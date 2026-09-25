# One Life: Handoff

Read this first, then `docs/MASTER_NOTE.md` for the full game design.

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
- **Publish:** Artifact tool, `publish` action, with `file_path: index.html`. The current artifact is https://claude.ai/artifact/EL6GNwZG4DuB9TXPdJ9iEd (published 25 September 2026 from this repo, with the replay dice and yearly steps). To update it from a new conversation, pass that URL as `url`. Keep the `sample` capability. The older artifact https://claude.ai/artifact/6DBbnkycFfx87e76B5App6 belongs to the original account and still shows the 212 KB version.

## Built so far
- The imported game: life events, 16 careers, investing, property, businesses, 42 achievements, 8 challenges, dynasties.
- Early product R&D and supplier system.
- **Replay dice (seeded randomness):** every game roll goes through `rnd()`. Each life gets a life code (`S.seed`), and the dice position (`S.rng`) is saved with the life. The same life code plus the same choices always gives the same life. `Math.random()` is used in only two places: making new life codes, and the AI storyteller's roll, so switching AI on or off never changes a life.
- **Yearly routine split into steps:** `YEAR_STEPS`, just above `ageUp()`, lists each yearly system in order (people, stats, prison, school, economy, university, work, income, business, angels, property, limits, events, net worth, decade review, death). Seeded robot runs gave identical fingerprints before and after the split.
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
