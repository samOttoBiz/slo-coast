# SLO COAST

A coastal spot finder by Sam Otto. Choose a time of day and a vibe to get one curated beach or coastal area in San Luis Obispo County, California. The illustrated light changes with your time preference, and each result explains the match and links to an official place source.

**[Open SLO COAST](https://samottobiz.github.io/slo-coast/)**

## Run locally

This is a static site with no installation, build step, API keys, or external packages. Open `index.html` in a browser, or serve the project folder with Python:

```sh
cd slo-coast
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Stop the server with Ctrl+C.

## Edit the site

- `index.html` contains the page structure, preference controls, result, and footer.
- `style.css` controls the responsive layout, colors, illustrated lighting, and motion.
- `app.js` handles matching, selection changes, result reveal, and reset.
- `data.js` holds the curated places, official sources, and editorial time/vibe preferences.
- `assets/coast-illustration.webp` is the local generated coastal artwork.
- `SOURCES.md` documents place facts and the limits of the suggestions.
- `CREDITS.md` records asset provenance and the source snapshot.

Keep new places in SLO County and maintain valid official source links. A vibe match is required; a matching time preference wins, and file order settles ties. If only the vibe matches, the result says so. Changing either preference clears a stale result. “Find another moment” clears the result and returns focus to the selected time so another search can begin.

## Publish

GitHub Pages serves the root of the `main` branch. Commit and push changes to `main`; no build command is required. `.nojekyll` keeps the deployment a plain static site.

## Content and artwork

The suggestions are editorial preferences, not live surf, weather, tide, safety, crowd, or access reports. Check the linked official notices and coastal advisories before visiting. The coastline artwork is imaginary and is not a photograph or map of a recommended destination.

The source snapshot contains no license file or third-party asset attribution requirement. No new reuse license is granted by this copy; see `CREDITS.md` for provenance.
