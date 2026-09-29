# One Life: working rules for Claude Code

One Life is a BitLife-style life simulator in a single HTML file (`One_Life.html`, one inline script, vanilla JS, no build step). Owner: David.

**Start every session by reading `docs/MASTER_NOTE.md`.** It is the source of truth for architecture, mechanics, pending decisions and the build plan. Read `docs/ARCHIVE.md` only when a specific historical detail is needed.

## Working agreements
1. **Clarify before committing.** Before any new change, explain what it means and confirm the design with David before touching code. Quick fixes to already-agreed features can be done directly.
2. **Concise and decision-oriented.** Short explanations, clear options. David answers tersely; "u decide" means pick the sensible option and say which.
3. **Build in phases and chunks.** Test between chunks. Do one small verified thing first, then extend.
4. **Test before delivering.** `npm test` (runs `tests/run-all.sh`): syntax, playtest, old saves, balance. All must pass, balance must show 0 numbers moved unless a re-baseline was agreed.
5. **Exact-match edits.** Use exact string replacement that matches once. For scripted patches, `assert s.count(old)==1` before each replacement.
6. **Be upfront.** If an edit fails or breaks something, say so plainly.
7. **No em dashes** in game text or docs (the syntax test counts them, keep at 0). Plain language.
8. **Money is always shown in US dollars**, even for foreign countries.
9. **After each completed block:** update `docs/MASTER_NOTE.md` (state, known issues, pending decisions, recent log), move old detail to `docs/ARCHIVE.md`, and commit.
10. **Credit awareness:** warn David when usage nears 90%.
11. **Heavy session:** when context gets long, update the master note, commit, and tell David to start a fresh session.
12. **Model choice:** say when a task needs Opus (new system design, refactors, rebalancing, stubborn bugs) or only Sonnet (content, UI tweaks, small fixes, docs), and ask David to switch.

## Keeping token use low
- Never read `One_Life.html` whole (about 480 KB). Use `grep -n` to find a function, then read only that range.
- Run tests through `npm test`; it prints a summary and full output only on failure.
- Keep the master note lean. History goes to the archive.

## Git
- Commit after each verified chunk with a clear message (for example `3.5.30 price lever: scope to non-default options`). Git history replaces the old `backup_vN.html` copies.
- Commit before any large edit so it can be rolled back with `git checkout`.
- Never commit a build that fails `npm test`.

## Commands
```
npm install                              # first time only, installs jsdom
npm test                                 # full suite, 6 lives
bash tests/run-all.sh One_Life.html 3    # quicker suite, 3 lives
node tests/playtest.js One_Life.html --lives 6
node tests/balance.js One_Life.html --write-baseline   # only after an agreed re-baseline
node -e "..."                            # ad-hoc jsdom checks, reuse tests/lib.js (load, drain)
```

## Publishing (stays in claude.ai)
The AI features need the claude.ai artifact with the `sample` capability. Claude Code cannot publish it. When a build needs publishing, David uploads `One_Life.html` to a claude.ai chat and publishes there, keeping `capabilities:{"sample":{}}` (never `{}`, which clears it). Artifact link is in the master note.
