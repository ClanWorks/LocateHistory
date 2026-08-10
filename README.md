# PhotoLocation

A GeoGuessr-style game: you're shown a historical photograph, painting,
or drawing and have to guess which city it depicts. Ten rounds per
session, three optional clues (region, era, country — each costs
points), a countdown timer, distance-based scoring, and a reveal screen
with a map, historical context, and full source attribution.

It's a fully static site — no backend, no database, no accounts. See
[§2 of plan.md](plan.md) for why, and the "Static answer visibility"
section below for the tradeoff that comes with it.

## Quick start

```bash
npm install
npm test              # 117 tests, pure logic + a real headless-browser-adjacent build pipeline
npx serve public       # or any static file server; open the printed URL
```

That's it for playing locally — `public/` already contains a generated,
playable build (manifest, gazetteer, and optimized images all committed).
You only need the steps below if you're changing the content library or
the build pipeline itself.

## Project layout

```
content/
  source/            # curator-owned source of truth (committed)
    items.json         # the curated item records
    gazetteer.json      # the full city guess pool (not just answers — see below)
    *.md                 # curation/migration notes and audit trail
  originals/         # raw downloaded images (gitignored — see below)
  schemas/            # JSON Schema for items/gazetteer/manifest
scripts/
  build-content.js     # the real build: validate -> process images -> emit public/
  lib/                  # validation and media-processing modules
  curate-*.js, migrate-*.js  # one-off content-curation scripts (kept for audit trail)
public/
  index.html, css/, js/  # the game client
  content/                # GENERATED: manifest.json, gazetteer.json — never edit by hand
  assets/                  # GENERATED: opaque, checksum-named, metadata-stripped images
test/                  # node:test suite
plan.md                # the full v1 design/architecture plan this was built against
```

## Content curation

`content/source/items.json` is the editorial source of truth — one
record per photo/painting/drawing, with license info, dates, region,
difficulty, and clue text. `content/source/gazetteer.json` is the full
list of guessable cities (currently 173) — deliberately much larger
than the ~20 answer cities, so the "country" clue and the searchable
city selector don't just hand the player the answer.

To add content:

1. Find the image on Wikimedia Commons and **check its actual license
   on the Commons file page** — don't trust an old cached title/caption.
   Only add it if the license is genuinely reusable (public domain,
   CC-BY, CC-BY-SA, etc.). If the license is unclear, leave the item
   `"status": "draft"` — the build excludes drafts automatically and
   only enforces license/sourceUrl presence for `"approved"` items.
2. Download the original into `content/originals/` (see
   `scripts/migrate-download-originals.js` for the pattern — it retries
   on Wikimedia's rate limiting).
3. Add the record to `content/source/items.json` following the schema
   in `content/schemas/item.schema.json`. If the city isn't already in
   `gazetteer.json`, add it there too (with real coordinates).
4. Run `npm run build:content` (see below) and `npm test`.

`content/originals/` is gitignored on purpose — raw historical scans
run tens of MB and don't belong permanently in git history. The build
pipeline turns them into the actual small, optimized, committed assets
under `public/assets/`. This means **a truly from-scratch checkout
can't regenerate the build without first re-fetching the originals** —
run `node scripts/migrate-download-originals.js` (safe to re-run; it
skips files that already exist) before `npm run build:content` if
`content/originals/` is empty. `public/` itself is always up to date in
git regardless, so playing the game never requires this step.

## Build

```bash
npm run build:content
```

Validates `content/source/items.json` and `gazetteer.json` (schema +
cross-references: no duplicate/unresolved place IDs, no duplicate
content IDs, sane date ranges, license/sourceUrl required on approved
items), rejects anything below `REQUIRED_ROUNDS` (10) approved items,
processes each approved item's image with `sharp` (strips EXIF/ICC/XMP
metadata, enforces a 480px minimum dimension, generates responsive
480/960/1600px JPEG variants under opaque checksum-derived filenames),
and only then atomically swaps the result into `public/content/` and
`public/assets/` — a failed or partial build never touches the real
output. See `scripts/build-content.js` and `scripts/lib/media.js` for
the details, and `--source`/`--content-out`/`--assets-out`/
`--min-dimension` for pointing it at a different location (used by the
test suite to build tiny fixtures without touching the real output).

## Testing

```bash
npm test          # unit tests (node:test)
npm run test:e2e  # end-to-end tests (Playwright, against the real built site)
npm run validate:content  # schema/cross-reference check of the real curated content
```

`npm test` runs the full `node:test` suite: the state machine and
scoring functions (pure, exhaustively boundary-tested), the content
build pipeline (including subprocess-level tests of the atomic asset
swap and failure rollback against real file system state), the media
pipeline (real image processing via `sharp`, including a test that
actually embeds EXIF into a fixture and confirms it's stripped, not
just asserted), and the client's pure helper modules (city search, map
projection, local storage).

`npm run test:e2e` drives a real headless Chromium against
`public/` (via `scripts/serve-static.js`, a minimal zero-dependency
static server used only for this): a full ten-round session through
Results and Replay, a round genuinely timing out (waits out the real
30s), and a broken image load followed by a confirmed Retry recovery.
This is what actually caught the integration bugs unit tests structurally
can't — stale city selection surviving an edited search, the round
timer starting before the image was ready, and an orphaned image
callback able to hijack a later round's timer — all now regression-
tested here instead of only verified ad hoc during development.

All of the above runs in CI on every push (`.github/workflows/ci.yml`).
`validate:content` checks the real `content/source/items.json` and
`gazetteer.json` (schema + cross-references — duplicate/unresolved IDs,
license presence, date sanity); it does not run a full image rebuild in
CI, since that needs `content/originals/`, which CI doesn't have any
more than a fresh clone does (see "Content curation" above). The real
image-processing code path (`sharp`, EXIF stripping, opaque naming) is
still exercised in CI, just via `npm test`'s fixture-based build tests
rather than the real curated originals.

## Deployment

`public/` is a complete, self-contained static site — no build step
needed to serve what's already committed. Nothing in the client depends
on provider-specific runtime features, so any static host works:
GitHub Pages, Cloudflare Pages, Netlify, Firebase Hosting (this repo
still has `firebase.json`/`.firebaserc` from the project's earlier
Firestore-based version, which work fine for pure static hosting too),
or a plain file server.

**Live v1 deployment:** [photolocation.pages.dev](https://photolocation.pages.dev)
(Cloudflare Pages, project name `photolocation`).

To deploy a new version after changing `public/`:

```bash
npx wrangler pages deploy public --project-name=photolocation
```

This requires being logged in (`wrangler login`) with a token that has
Pages write access. Each deploy is a new, independently-addressable
deployment (`https://<deployment-id>.photolocation.pages.dev`); the
most recent deploy to the production branch automatically becomes the
live `photolocation.pages.dev` alias.

**Rollback (preferred): the Cloudflare dashboard.** Pages → the
`photolocation` project → Deployments tab → find the last-known-good
deployment → "Rollback to this deployment". Instant, no local checkout,
no CLI. One real constraint: [Cloudflare only allows rolling back to a
previously-successful **production** deployment](https://developers.cloudflare.com/pages/configuration/rollbacks/) —
preview deployments aren't valid rollback targets. Since this project
deploys straight to production on every `wrangler pages deploy` (no
preview/branch step in between), that's not a practical limitation here,
but it's worth knowing if that changes later.

**Rollback via CLI**, if you need it scripted or the dashboard isn't
available:

```bash
npx wrangler pages deployment list --project-name=photolocation
```

lists every past deployment with its commit hash — pick the
last-known-good one. Redeploying that commit's `public/` must not touch
your current working tree (`git checkout <sha> -- public` stages that
old version into your live working directory, silently discarding any
uncommitted changes to `public/` you might have — a real risk, not a
hypothetical one). Use an isolated worktree instead:

```bash
git worktree add /tmp/photolocation-rollback <sha>
npx wrangler pages deploy /tmp/photolocation-rollback/public --project-name=photolocation
git worktree remove /tmp/photolocation-rollback
```

Nothing in your actual working directory is touched at any point. No
rebuild is needed either way — Pages keeps the real uploaded files for
every past deployment, so this is just re-pointing production at a
known-good commit's snapshot, not a fresh build.

## Local storage

The only thing persisted anywhere is in the player's own browser,
under the `photolocation:` prefix in `localStorage`:

- `photolocation:hasSeenIntro` — skip the intro screen on repeat visits.
- `photolocation:bestScore` — the best total session score seen on this device.

There are no accounts, no server-side history, and no cross-device
sync — see plan.md §20 for the full list of things v1 deliberately
doesn't do.

## Static answer visibility

Because there's no backend, the generated `public/content/manifest.json`
and `public/content/gazetteer.json` are public, static files — anyone
can view them directly and read every answer. Image filenames are
opaque (checksum-derived, not the original descriptive filename) and
the source page link (`attribution.sourceUrl`) is only shown after a
round is answered, which stops *casual* spoilers, but this is not
cryptographic secrecy: a player who opens devtools and reads the JSON
can see every answer in advance. That's an accepted tradeoff for a
solo, non-competitive v1 (plan.md §2) — it would need to change (a
small trusted backend for round assignment and score validation) before
any competitive feature like a shared leaderboard or a fair daily
challenge could be built on top of this.
