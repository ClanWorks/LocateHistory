# M0 migration notes (2026-08-09)

## Working tree

- `.DS_Store` was tracked but never gitignored — now untracked and added to `.gitignore`.
- Uncommitted `package.json`/`package-lock.json` additions (`@genkit-ai/core`, `@genkit-ai/googleai`) and an untracked `apphosting.yaml` represented an in-progress Firebase App Hosting + Genkit (AI-generated content) experiment. Both `@genkit-ai/*` and `firebase-admin` were actually installed in `node_modules`, so this wasn't a stray edit — real work happened here. It conflicts with plan.md §20 (AI-generated clues/descriptions are an explicit v1 exclusion), so it was preserved rather than discarded: `git stash list` → `stash@{0}: "abandoned genkit/apphosting experiment (v1 excludes AI content per plan.md §20)"`. Recoverable with `git stash apply stash@{0}` if AI-assisted content generation becomes relevant again (e.g. drafting `context` text for curator review, not live generation).

## Branch

- Redesign work happens on `v1-static-redesign`, branched from `main` @ `4c7cef7`.
- `main` and `gh-pages` are untouched.

## Credential audit

- `config/photolocation-54a1d-firebase-adminsdk-fbsvc-c654c3cd30.json` was gitignored and not present in any reachable git history throughout its life in this working tree. `.git/filter-repo/` confirms a history rewrite already ran (2025-01-21), consistent with this cleanup having already happened once.
- Conclusion at the time: no evidence of exposure in this repository's history. Git history alone can't prove the key was never copied or shared outside this repo, so this wasn't a guarantee of safety, only an absence of a specific kind of evidence.
- **2026-08-09 update**: the M2 content library is now built and verified (production `npm run build:content` publishes all 20 approved items, output matches the committed manifest) — the condition this notes file said would trigger deletion. The credential file has been deleted from disk. `config/addCityCLI.cjs` (the old interactive Firestore CLI it powered) and `scripts/migrate-firestore-export.js` (the one-off export script, also credential-dependent) were removed with it — both are fully superseded by `scripts/build-content.js`. `firebase-admin` and `readline-sync` were dropped from `package.json` since nothing references them anymore. The raw/flat Firestore exports and this notes file are kept — see below.

## Firestore export

- Live project: `photolocation-54a1d`, collection `cities`, 62 documents.
- The Admin SDK's default gRPC transport hung indefinitely on `.get()` in this environment (plain HTTPS worked fine — confirmed separately). Worked around by calling the Firestore REST API directly via `google-auth-library` for token exchange. If this environment issue recurs elsewhere, prefer REST over the gRPC-based SDK client.
- `scripts/migrate-firestore-export.js` — one-off export script; removed 2026-08-09 once its output was fully migrated into `content/source/items.json` and `gazetteer.json` (see credential audit above). No longer runnable without the deleted credential, and no longer needed.
- `content/source/_firestore_export_raw.json` — raw Firestore REST response (typed field wrappers), kept as the audit-trail original.
- `content/source/_firestore_export_flat.json` — flattened plain-JSON version (name/country/year/title/image_url/etc per record), meant as M2's mapping input into the real curator schema (plan.md §9). Neither file is the curator schema yet — no coordinates, difficulty, licensing, or `depictedDate` split exists yet.
- **Data quality issue found in the export**: one record's `name` field is `\Copenhagen` (literal leading backslash) instead of `Copenhagen` — a duplicate/typo of the correct Copenhagen entry. Left as-is in the raw/flat exports; needs resolving during M2 schema mapping (either fix or drop as a duplicate). This is exactly the class of error the M1 build validation is meant to catch going forward.

## Deployment state

- `firebase.json` targets Firebase Hosting, serving `public/` — this is the config for the *current* Firestore/JS app, but live deployment status wasn't checked (would require an authenticated `firebase` CLI session, not attempted here).
- `gh-pages` branch is stale and unrelated to the current app: last updated 2025-01-17, contains the old Phaser.js/pygame-web-export build (`src.apk`, `web-cache/`), not the Firestore version. Treat it as historical, not a live target, unless GitHub Pages is deliberately chosen as the v1 static host per plan.md §5.
