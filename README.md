# Touchline Intel

A standalone, mobile-friendly eFootball Mobile fan-guide project. It includes a pack chance and coin-budget calculator, a source-first player release tracker, official redeem-code notices, a Player Styles Guide, and coach and squad-building guides.

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
- The Coach Lab loads coach profiles and suggested lineups from `data.json`; add another object to the `coaches` array to add a coach.
- `data.json` also contains the Player Styles catalog, player style IDs, and Latest Players list. Add styles to `playerStyles`, add player entries with a matching `styleId` to `players`, and list their IDs in `latestPlayers` to feature them on the homepage.
- Coach Lab keeps each suggested starting XI intact and displays a separate style-filtered shortlist for Fabio Capello and Xabi Alonso. Jose Mourinho currently has no coach-specific style filter.
- `player-instructions.html` loads the individual instruction setups in `data.json`. Coach selection is shared between Coach Lab and Player Instructions in the same browser.
- The site header uses a sticky, horizontally scrolling, scrollbar-hidden navigation with snap points, scroll cues, arrows, and active-tab centering.

Release and code information is intentionally not guessed. Check the linked official sources and the in-game News for current details.

## Run Coach Lab locally

Because Coach Lab loads `data.json` with `fetch`, open the site through a local web server instead of opening the HTML files directly. From this folder, run `py -m http.server 8000` and visit `http://localhost:8000/coach-squad-guides.html`.

The homepage Player Styles Guide and Latest Players cards use the same JSON file and also require a local web server.

Player Instructions and Coach Lab also load `data.json`, so use the local web server to try the shared coach selection and Copy Setup feature.
