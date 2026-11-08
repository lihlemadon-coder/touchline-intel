# Touchline Intel

A standalone, mobile-friendly eFootball Mobile fan-guide project. It includes a pack chance and coin-budget calculator, a source-first player release tracker, official redeem-code notices, and a combined Player Styles & Instructions guide.

## Run locally

Open `index.html` in a browser. The project has no build step or external JavaScript dependencies.

## Calculator assumptions

- Enter the target player's per-draw percentage from the current in-game pack details, plus the in-game cost for a 10-draw pack.
- The calculator budgets in complete 10-draw packs; remaining coins below one pack's cost are not counted.
- Every draw is treated as independent, with the same target-player probability. The chance within budget is `1 - (1 - rate)^(10 × packs)`.
- Expected packs are a long-run average of 10-draw packs until at least one target-player hit, not a guarantee.
- Guarantees, changing pack pools, bonuses, and special draw mechanics are not modeled.
- "Expected draws" and "expected coin cost" are long-run averages, not a promise or a recommended spend.
- Verify rates and offers in the game. Community reports may be incomplete or incorrect.

The site is independent and is not affiliated with Konami. It does not automate purchases or claim guaranteed pulls.

## Intel pages

- `player-tracker.html` explains how to follow confirmed player announcements. It is not a live feed; verify current availability in-game.
- `redeem-codes.html` provides code-safety guidance. It lists no code unless it can be verified through an official source.
- `coach-squad-guides.html` covers coach selection and practical squad-building principles.
- `data.json` stores the guide's suggested instruction setups, player-style descriptions, and pack/calculator content. It remains separate from the sourced player and manager card records.
- `data/players.json` stores sourced, card-specific player data and the associated club/national squads and manager records. The player list groups by name and selects the Standard card when one is available; opening a player shows the rest of that player's variants and their own stats and skills. Values not supplied by the source remain null.
- `data/coaches.json` stores sourced manager-card versions, including their individual six-playstyle affinities. Coach Lab reads this file and `data/players.json`; unsupported or unmapped values are shown as unavailable rather than guessed.
- The Player Styles & Instructions guide combines style recommendations, coach selection, formation selection, an adjustable pitch, player-style assignments, and card search filters. Goalkeepers are excluded from instruction tables.
- Coach Lab shows coach names first, then lets users select among sourced card versions. The selected coach name is shared with the combined guide in the same browser; version details are kept separate from editorial instruction setups.
- eFHUB and eFootball DB are linked as research sources. Player card art, coach portraits, pack banners, ratings, skills, and live pack details are not copied or guessed; only add records that can be verified for the exact card/version.
- The site header uses a sticky, horizontally scrolling, scrollbar-hidden navigation with snap points, scroll cues, arrows, and active-tab centering.

Release and code information is intentionally not guessed. Check the linked official sources and the in-game News for current details.

## Run interactive guides locally

Because the interactive guides load `data.json` with `fetch`, open the site through a local web server instead of opening the HTML files directly. From this folder, run `py -m http.server 8000` and visit `http://localhost:8000/`.

The old `player-instructions.html` URL redirects to the combined guide for existing bookmarks.
