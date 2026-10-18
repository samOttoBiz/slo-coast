# SLO COAST

A small coastal field guide by Sam Otto. Pick a time and a vibe, or browse five San Luis Obispo County places. Get a curated recommendation with practical access information, an outing idea, official sources, map search and alternatives.

**[Open SLO COAST](https://samottobiz.github.io/slo-coast/)**

## What it does

- Matches five times of day and four vibes against five curated places.
- Changes the illustrated light to reflect the selected mood.
- Shows concise place descriptions and distinguishes a time-and-vibe match from a vibe match.
- Shows real destination photographs, with photographer/source/license credits.
- Lists verified access facts with official source links, Pismo and Morro Surfline links, and an Avila coffee stop from the local visitor guide.
- Lets visitors browse all five places or compare alternatives for their vibe.
- Creates URLs that restore the chosen place, time and vibe; copy the address bar to share.
- Links to official coastal advisories; reset washes the result away with a wave, unless reduced motion is enabled.
- Uses responsive layouts, native radio controls, keyboard focus, a skip link and reduced-motion support.

## Favorites

The Favorites tab stores visited places, their order, notes and optional photos in IndexedDB on this browser and origin. Add a guide destination or a custom place; use Move up / Move down to rank it. Edit changes only take effect when saved. Removing a place requires an inline confirmation and also removes its local photo.

No personal entries or photos are uploaded, committed to GitHub, included in plan URLs or synchronized across devices. Clearing site/browser data removes them; private browsing and browser storage eviction can also remove data. The current limits are 100 entries, 100 characters per name, 3,000 per note, and 30 MB of processed photos. JPG, PNG and WebP inputs up to 10 MB / 25 megapixels are decoded locally, resized to at most 1,600 pixels and re-encoded as JPEG (up to 2 MB each), without original metadata. One photo per favorite. Local storage failures are shown explicitly; drafts remain open on failed saves. Concurrent writes use an IndexedDB transaction and conflicting edits require reopening the entry.

## Run and test locally

No packages, build step, API keys or external fonts are required. Open `index.html`, or serve the directory:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Stop with Ctrl+C. Run the deterministic matcher and data regression checks with Node:

```sh
node test.js
node favorites.test.js
```

The checks cover all 20 time/vibe combinations, all 55 supported explicit place plans, malformed and missing data, unsupported inputs and source URL validation. Browser QA also covers the collection, alternative selection, reset, sharing, narrow layouts and external link targets.

## Edit and publish

- `index.html`: structure, controls, recommendation and coastal advisory link.
- `style.css`: responsive layout, lighting and restrained transitions.
- `app.js`: deterministic matching, browsing, URL restoration, alternatives and plan URLs.
- `favorites-store.js`: local database, photo processing, input limits and atomic updates.
- `favorites.js`: Favorites tabs, editor, rankings and local-only photo previews.
- `data.js`: places, editorial preferences and sourced access details.
- `assets/coast-illustration.webp`: local generated opening illustration.
- `assets/photos/`: five real, licensed destination photographs.
- `SOURCES.md`: fact sources, review date and methodology.
- `CREDITS.md`: asset and source provenance.

A vibe match is required; a time match wins, and file order settles ties. Choosing another time or vibe clears an old result. Browsing a place updates incompatible choices to that place's supported defaults. Reset clears the result and plan URL, keeps the user's choices, and returns focus to the time control.

GitHub Pages serves the root of `main`; `.nojekyll` keeps it a plain static deployment. Publish tested changes to `main` and verify the live page.

## Fallback and rollback

The working pre-workshop version is commit `38e0174f8960bf14128aa81e665f9ff99b7c629e`, also retained as `before-workshop-2026-10-18`. Its original checkout was preserved. To roll back after publication, restore the baseline files in a new commit and publish that commit; avoid rewriting shared history. The static site also works from a local copy if the workshop network fails.

## Limits

This is a small editorial collection, not a comprehensive beach directory. There are no live weather, surf, tide, crowd, accessibility or closure feeds, no AI backend, no geolocation, no analytics, no accounts and no bookings. Check official notices before going. The imaginary coastline is labelled as an illustration and is not a destination photograph. External map and official-source links require network access.

Third-party photographs retain their individual CC BY, CC BY-SA, CC0 or public-domain terms. No new reuse license is granted for the original code or generated artwork; see `CREDITS.md`.
