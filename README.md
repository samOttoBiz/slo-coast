# SLO COAST

A small coastal field guide by Sam Otto. Pick a time and a vibe, or browse five San Luis Obispo County places. Get a curated recommendation with practical access information, an outing idea, official sources, map search and alternatives.

**[Open SLO COAST](https://samottobiz.github.io/slo-coast/)**

## What it does

- Matches five times of day and four vibes against five curated places.
- Changes the illustrated light to reflect the selected mood.
- Explains the match and labels time mismatches honestly.
- Lists verified access facts with official source links.
- Lets visitors browse all five places or compare alternatives for their vibe.
- Creates shareable URLs that restore the chosen place, time and vibe. Copying requires clipboard support; the address bar is the fallback.
- Provides a simple preparation checklist. Checks last for the current page session and are not saved or shared.
- Uses responsive layouts, native radio controls, keyboard focus, a skip link and reduced-motion support.

## Run and test locally

No packages, build step, API keys or external fonts are required. Open `index.html`, or serve the directory:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Stop with Ctrl+C. Run the deterministic matcher and data regression checks with Node:

```sh
node test.js
```

The checks cover all 20 time/vibe combinations, all 55 supported explicit place plans, malformed and missing data, unsupported inputs and source URL validation. Browser QA also covers the collection, alternative selection, reset, sharing, narrow layouts and external link targets.

## Edit and publish

- `index.html`: structure, controls, recommendation and preparation checklist.
- `style.css`: responsive layout, lighting and restrained transitions.
- `app.js`: deterministic matching, browsing, URL restoration, alternatives and sharing.
- `data.js`: places, editorial preferences and sourced access details.
- `assets/coast-illustration.webp`: local generated coastal illustration.
- `SOURCES.md`: fact sources, review date and methodology.
- `CREDITS.md`: asset and source provenance.

A vibe match is required; a time match wins, and file order settles ties. Choosing another time or vibe clears an old result. Browsing a place updates incompatible choices to that place's supported defaults. Reset clears the result and plan URL, keeps the user's choices, and returns focus to the time control.

GitHub Pages serves the root of `main`; `.nojekyll` keeps it a plain static deployment. Publish tested changes to `main` and verify the live page.

## Fallback and rollback

The working pre-workshop version is commit `38e0174f8960bf14128aa81e665f9ff99b7c629e`, also retained as `before-workshop-2026-10-18`. Its original checkout was preserved. To roll back after publication, restore the baseline files in a new commit and publish that commit; avoid rewriting shared history. The static site also works from a local copy if the workshop network fails.

## Limits

This is a small editorial collection, not a comprehensive beach directory. There are no live weather, surf, tide, crowd, accessibility or closure feeds, no AI backend, no geolocation, no analytics, no accounts and no bookings. Check official notices before going. The imaginary coastline is labelled as an illustration and is not a destination photograph. External map and official-source links require network access.

No new reuse license is granted by this copy; see `CREDITS.md`.
