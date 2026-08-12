# PhotoLocation — Product and Implementation Plan

Status: planning; redesign code has not started.

PhotoLocation began as a pygame prototype in January 2025 (`git show 5073b77:src/main.py`), moved to Phaser.js, and was then rewritten as the current plain HTML/JavaScript application backed by Firebase and Firestore. This plan replaces that architecture with a static game for v1 and v2. A trusted backend is deferred until competitive features make it necessary.

## 1. Product definition

PhotoLocation is a web game about identifying a city from a historical photograph, painting, or drawing. The player studies an image, selects a city through a searchable city selector, and earns points based on geographic accuracy, response time, and clues used. After every guess, the game reveals the correct location, shows both locations on a map, and provides historical context and source attribution.

The v1 objective is to prove that this core loop is enjoyable with a curated content set—not to build a content platform, database application, or competitive service.

## 2. Architectural decision

### v1 and v2 are fully static

The curated library changes only when the project owner deliberately adds or approves content. It is not live, multi-writer, user-generated, or real-time. Firestore and the Firebase Admin SDK therefore solve problems the game does not currently have.

For v1 and v2:

- Curator-owned source records live in version-controlled JSON.
- Original source images remain outside the public build and normally outside Git.
- A local build script validates content, strips image metadata, generates optimized assets with opaque names, and produces a sanitized public manifest.
- The browser loads the generated manifest and assets as an ordinary static site.
- Scores and preferences are stored locally in the browser.
- The site can be hosted by any suitable static host.
- There are no production credentials, databases, server functions, or public write paths.

This is a deliberate tradeoff: a determined player can inspect the public manifest and discover answers. Opaque asset names prevent accidental spoilers, not adversarial inspection. That is acceptable for solo play and noncompetitive local scores.

### Trusted services are deferred to competitive v3

A public leaderboard cannot trust client-computed scores when the static client contains the answer key. If competitive rankings are later justified, v3 introduces a small trusted API that controls round assignment, clue issuance, authoritative timing, guess resolution, scoring, replay protection, authentication, and rate limiting. It must not merely accept a client-generated final score.

## 3. Why the current version will be replaced

- It downloads Firestore records directly even though the library is curated offline.
- One correct answer plus two random alternatives makes difficulty accidental.
- Image URLs, filenames, metadata, titles, or source pages may reveal answers casually.
- The schema lacks coordinates, aliases, licensing, context, difficulty, curation, and stable IDs.
- Game state is implied by DOM visibility; this caused the current timeout bug.
- Scoring does not reward geographic accuracy, speed, or playing without clues.
- Content can only be added one record at a time with `addCityCLI.js`.
- Firebase Admin introduces a credential class that a static game does not need.
- The README describes an older interface and no longer matches the application.

The redesign replaces the game flow and data pipeline. Existing Firestore records are migration input only.

## 4. Scope

### v1 — prove the complete loop

- One ten-round mode.
- Searchable city selector backed by a controlled gazetteer.
- Geographic distance scoring.
- Three optional clues: region, era, and country.
- Explicit game state machine.
- Generated static content manifest and optimized image assets.
- Post-answer map, context, attribution, and score breakdown.
- Results screen and best session score stored locally.
- Curated seed library of 10–20 approved items.
- Batch content validation and build pipeline.
- Responsive, keyboard-accessible interface.

### v2 — replay and learning

- Quick Game difficulty progression.
- Practice filters for region, era, and difficulty.
- Larger library and improved curator workflow.
- Local performance history and topic statistics.
- Additional clues and empirically adjusted difficulty.
- Optional noncompetitive Daily Challenge generated deterministically from public content.

### v3 — optional competitive layer

- Trusted server-controlled sessions and round resolution.
- Authentication and server-side player records.
- Competitive Daily Challenge and leaderboards.
- Achievements, streaks, replay protection, rate limiting, and abuse controls.

Do not start v2 until v1 has been played repeatedly and evaluated. Do not build v3 unless real player demand justifies the operational and security cost of competition.

## 5. Locked v1 decisions

**Platform:** a responsive static web application.

**Guess input:** a searchable city selector, not fuzzy free text or a precision map pin. Each option has a canonical gazetteer ID, display name, country, coordinates, and aliases. The map is used in the reveal.

**Images:** approved images are processed locally. The public build contains normalized web assets under opaque, content-derived identifiers. Original filenames, embedded metadata, and source-page URLs are not used as pre-answer image URLs.

**Content:** photographs, paintings, and drawings are allowed, but the work's creation date and the depicted scene date are separate. The answer is always the depicted location.

**Answer visibility:** v1 reduces accidental leakage but does not claim cryptographic secrecy. Answers are present in public generated data because the game is static and solo.

**Hosting:** hosting remains provider-neutral until deployment. GitHub Pages, Cloudflare Pages, Firebase Hosting, or another static host may be selected based on repository integration, limits, and operational preference. The game must not depend on provider-specific runtime features in v1.

## 6. Complete v1 loop

1. **Loading:** load and validate the generated manifest, gazetteer, and local settings.
2. **Intro:** on first use, explain guessing, clues, timing, and scoring.
3. **Session setup:** select ten approved, nonduplicated items, optionally using a stored seed for reproducibility.
4. **Playing:** show the image, timer, city selector, and unused clue controls.
5. **Clue requested:** reveal one clue, record its penalty, and continue the timer.
6. **Resolving:** lock input and calculate distance and score from immutable round state.
7. **Answered:** show correct and guessed places, distance, map, score breakdown, context, and attribution.
8. **Timed out:** lock input and reveal the answer with zero points through its own state transition.
9. **Transition:** continue after deliberate player input.
10. **Results:** show total score, local best, per-round results, replay, and exit.
11. **Error:** provide retry or safe exit for manifest, image, and local-storage failures. (No separate map failure mode — see §16.)

The client prevents double submission and score mutation after a round resolves.

## 7. State model

```text
boot -> loading -> intro -> session_setup -> playing
playing -> resolving -> answered | timed_out | error
answered | timed_out -> playing | results
error -> loading | playing | results
results -> session_setup
```

One explicit state controls actions, timers, and visible components. Timer expiry dispatches its own transition and never simulates a normal answer click. Scoring functions are pure and operate on a frozen round snapshot.

## 8. Source, generated, and public boundaries

Recommended layout:

```text
content/
  source/
    items.json              # curator-owned complete records
    gazetteer.json          # supported cities and aliases
  originals/                # ignored local source images
  schemas/                  # machine-readable validation schemas
scripts/
  build-content.*           # validate and generate public artifacts
public/
  content/
    manifest.json           # generated public game records
    gazetteer.json          # generated searchable city subset
  assets/                   # generated optimized images with opaque names
```

`content/source` is the editorial source of truth. `public/content` and `public/assets` are generated artifacts and must never be edited manually. Original high-resolution images normally remain ignored so they do not permanently inflate Git history. Small generated web assets may be committed initially; move them to a static object bucket when repository size or deployment performance warrants it.

The build fails rather than publishing partial, invalid, unlicensed, or answer-leaking content.

## 9. Curator source schema

```js
{
  schemaVersion: 1,
  id: string,
  status: "draft" | "approved" | "retired",
  workType: "photo" | "painting" | "drawing",
  title: string,
  artistOrCreator: string | null,
  depictedDate: { minYear: number, maxYear: number },
  creationDate: { minYear: number, maxYear: number } | null,
  location: {
    placeId: string,
    acceptedPlaceIds: string[]
  },
  classification: {
    region: string,
    difficulty: 1 | 2 | 3 | 4 | 5,
    landmarkCategory: string | null,
    tags: string[]
  },
  clues: { region: string, era: string, country: string },
  media: {
    originalPath: string,
    focalPoint: { x: number, y: number } | null
  },
  attribution: {
    source: string,
    license: string,
    sourceUrl: string,
    creditText: string | null
  },
  context: string,
  contentWarning: string | null,
  curation: {
    approvedBy: string | null,
    approvedAt: string | null,
    notes: string | null
  },
  importSource: string,
  createdAt: string,
  updatedAt: string
}
```

Difficulty is editorial in v1. Later versions may suggest changes using aggregated play-test results. Derived labels such as era should be calculated consistently unless an explicit editorial override is needed.

## 10. Generated public manifest

Only approved records enter the manifest:

```js
{
  manifestVersion: 1,
  generatedAt: string,
  contentHash: string,
  items: [{
    id: string,
    workType: string,
    image: {
      src: string,
      srcset: string,
      width: number,
      height: number,
      placeholder: string | null
    },
    location: {
      placeId: string,
      acceptedPlaceIds: string[]
    },
    depictedDate: { minYear: number, maxYear: number },
    creationDate: { minYear: number, maxYear: number } | null,
    classification: { region: string, difficulty: number, tags: string[] },
    clues: { region: string, era: string, country: string },
    title: string,
    artistOrCreator: string | null,
    context: string,
    attribution: { source: string, license: string, sourceUrl: string, creditText: string | null }
  }]
}
```

This data is public even if the interface reveals some fields only after guessing. The build removes curator notes, local paths, import provenance, original filenames, administrative fields, and `contentWarning` — the last is curator-only editorial metadata for content-selection judgment calls (e.g. flagging wartime imagery), not a player-facing feature; v1 has no content-filtering or warning-display UI.

## 11. Gazetteer

```js
{
  id: string,
  displayName: string,
  country: string,
  countryCode: string,
  lat: number,
  lng: number,
  aliases: string[],
  historicalNames: string[]
}
```

Search covers display names and aliases but always resolves to the canonical ID. v1 may intentionally support a limited set of cities. The generated public gazetteer needs only the places available as guesses, but every content location and accepted alternative must resolve during the build.

## 12. Scoring contract

Each round lasts 30 seconds and is worth at most 1,000 points.

```text
if distanceKm <= 10:
  accuracy = 800
else:
  accuracy = round(800 * exp(-(distanceKm - 10) / 750))

timeBonus = round(200 * remainingMs / 30000)
roundScore = max(0, accuracy + timeBonus - cluePenalties)
```

- Distance uses the great-circle calculation.
- Accuracy is clamped to 0–800; time bonus to 0–200.
- Region costs 75 points, era 100, and country 200.
- Clues do not pause the timer and can each be requested once.
- Timeout scores zero.
- Accepted alternative places use the most favorable valid coordinate.
- Round inputs are frozen at resolution; subsequent UI events cannot alter the result.
- Identical inputs produce identical scores.

These are versioned starting values for play-testing, not permanent balance decisions. Local scores are for personal feedback, not trusted competition.

## 13. Content build pipeline

Replace the interactive Firestore CLI with a deterministic local build command. For each item it must:

1. Validate source JSON against the current schema.
2. Reject duplicate content IDs and unresolved gazetteer IDs.
3. Verify date ranges, clue fields, context, and attribution.
4. Confirm the declared licence permits the intended use and transformation; uncertain items remain drafts and are excluded.
5. Load the local original image from an allowed content directory.
6. Decode the image and enforce minimum dimensions.
7. Strip EXIF and other embedded metadata.
8. Generate normalized responsive formats and sizes.
9. Use opaque deterministic asset names derived from content identity and bytes, never descriptive source filenames.
10. Calculate dimensions, MIME type, size, and checksum.
11. Emit only approved records and referenced assets.
12. Fail on missing assets, invalid approved records, unsafe paths, or inconsistent output.

An optional separate validation command may report draft problems without failing the playable build. Approval remains a deliberate source-file change visible in Git review. Ten approved items are required; twenty are preferred for replay testing.

## 14. Repository and credential cleanup

Verified state:

- The Firebase Admin service-account JSON exists locally.
- `.gitignore` covers it, and it is not tracked in current reachable history.
- The repository indicates that `git filter-repo` ran previously, which may explain earlier cleanup.

Actions:

- Check audit history for prior exposure. Revoke the key if exposure is possible or cannot be ruled out.
- Delete the local service-account file once Firestore migration is complete and verified.
- Remove Firebase Admin, Firestore ingestion code, and unused dependencies from the redesign.
- Remove Firebase configuration files only after deciding whether Firebase Hosting remains the static host.
- Retain ignore rules for originals, credentials, generated local caches, `node_modules`, and `.DS_Store`.
- Reconcile unrelated working-tree changes before implementation.

The target v1 build must require no secrets or cloud credentials. Deployment authentication belongs to the developer's hosting workflow, not to the application or repository.

## 15. Accessibility and responsive requirements

- All actions work by keyboard, with predictable focus after transitions and errors.
- Timer updates do not create disruptive screen-reader announcements every second.
- Images have non-spoiling alternative text before reveal and descriptive text afterward.
- Colour is not the sole correctness indicator.
- Controls meet reasonable target-size and contrast requirements.
- Narrow mobile and desktop layouts avoid horizontal scrolling.
- Reduced-motion preferences are respected.

These are v1 foundations, not deferred polish.

## 16. Failure handling and diagnostics

Distinguish manifest, schema-version, image, gazetteer, and local-storage failures. Recoverable operations offer retry; a broken item can be skipped without mutating completed scores. If fewer than ten valid items remain, the session does not start and explains the content problem.

**No separate map-load failure mode (added post-M3, during M4 review).** The original plan listed "map" alongside manifest/image/local-storage as a distinguishable failure category. In the shipped implementation the reveal map is synchronous, local SVG rendering — `project()`/`graticuleLines()` are pure coordinate math over numbers already validated at build time, and `answerPlace`/`guessPlace` are always real gazetteer entries by construction, because `validateSourceCollection` rejects any item whose `placeId` doesn't resolve in the published gazetteer before the manifest is ever generated. There is no network request, no async operation, and no "missing place" case left over at runtime for a map failure to represent — unlike manifest/image (real fetches that can fail) or local-storage (a real browser API that can throw), there's nothing left to catch. Building a map-error UI path and a test for it would be handling a failure that cannot occur, not closing a real gap. §6, §17, and §18 have been updated to match; this paragraph is the recorded rationale those sections point back to.

Development builds log actionable validation details. Production errors avoid exposing local curator paths. v1 requires no analytics service; play-test observations can be recorded manually. Privacy-conscious aggregate analytics may be considered later.

## 17. Testing

Automated tests cover:

- Every valid and invalid state transition.
- Timer expiry and answered versus timed-out behavior.
- Double-submit protection and immutable resolved rounds.
- Distance calculation and scoring boundaries.
- Clue penalties and timer behavior.
- Nonduplicated session selection. (Seeding for reproducible sessions was left as the optional part of §6 step 3 it was always specified as — no seed exists in the shipped client, and nothing tests one.)
- Source-schema and gazetteer validation.
- Public-manifest sanitization.
- Metadata removal and opaque asset naming.
- Draft exclusion, missing images, and undersized libraries.
- Image-load and local-storage failure behavior. (No map-load failure — see §16.)

`e2e/complete-session.spec.js` and `e2e/timeout-and-recoverable-failure.spec.js` (Playwright, against the real built site) cover the end-to-end complete-session case and the timeout/recoverable-asset-failure case respectively — added during M4 review, run via `npm run test:e2e`.

Content validation runs in CI (`.github/workflows/ci.yml`) before every deploy, but as schema/cross-reference validation against the real `content/source/*.json` (`npm run validate:content`), not a full image-processing rebuild — CI has no access to `content/originals/`, which is deliberately gitignored (§8) and therefore no more present in a CI checkout than in a fresh local clone. The full build-content.js/media.js pipeline, including real sharp image processing, does still run in CI — via `npm test`, against the small synthetic fixtures in `test/fixtures/`, not the real curated originals.

## 18. v1 acceptance criteria

v1 is complete only when:

- A player can finish ten rounds from intro through results.
- Sessions contain ten approved, nonduplicated items.
- The application performs no Firestore, database, or application-backend requests.
- The public build contains no credentials, curator notes, original paths, or embedded image metadata.
- Pre-answer UI and image filenames do not casually reveal answers; documentation clearly states that public data remains inspectable.
- Guess, timeout, clue, image-error, and manifest-error transitions work correctly. (No map-error transition exists or is required — see §16.)
- Repeated UI events cannot award or alter points twice.
- Scoring is deterministic and boundary-tested.
- Every published item has a valid optimized image, canonical place, context, and verified attribution fields.
- The game is keyboard-usable and works at agreed mobile and desktop widths.
- A clean checkout can validate content, generate the public build, run tests, and produce the deployable site with documented commands.
- The README covers setup, content curation, build, testing, deployment, local storage, and the static answer-visibility tradeoff.
- At least five complete manual play sessions are recorded before v2 begins.

## 19. Milestones

### M0 — safe baseline and migration export

Reconcile working-tree changes, export any required Firestore records into source JSON, audit/revoke the service credential if necessary, document the current deployment, and branch from a known commit.

**Deliverable:** clean baseline, credential decision recorded, and existing content preserved without requiring Firestore.

### M1 — static contracts and build skeleton

Finalize source, manifest, gazetteer, and scoring schemas. Implement source validation, deterministic manifest generation, and the tested state-machine reducer.

**Deliverable:** reproducible static build with fixture content and no production credentials.

### M2 — media pipeline and seed content

Implement metadata removal, responsive image generation, opaque naming, validation, and approval filtering. Curate 10–20 suitable items and verify attribution.

**Deliverable:** validated static library capable of supplying a ten-round session.

### M3 — playable v1

Build the responsive client and integrate city search, clues, local scoring, reveal map, results, local best score, and failure handling.

**Deliverable:** complete locally served static game.

### M4 — verification and deployment

Complete automated, accessibility, responsive, and manual checks; update documentation; deploy to a preview; validate; promote through the selected static host; document rollback.

**Deliverable:** deployed static v1 satisfying all acceptance criteria.

### M5 — play-test gate

Play five full sessions and record interaction problems, content quality, score distribution, clue use, and replay motivation. Decide whether to tune v1 or begin v2.

**Deliverable:** written play-test decision and prioritized follow-up work.

### Future v3 architecture gate

Before implementing a trusted backend, write a separate threat model and product justification. Define which competitive promises are being made and why local/noncompetitive play is insufficient. Only then choose a serverless platform and design session, clue, guess, score, authentication, and abuse-prevention APIs.

## 20. Explicit v1 exclusions

- Firestore or another application database
- Runtime application secrets or service-account credentials
- Server functions and server-authoritative scoring
- Accounts and cross-device profiles
- Public leaderboards and trusted Daily Challenges
- Achievements, streak rewards, and multiplayer
- User-submitted content
- AI-generated clues or descriptions
- Comprehensive worldwide gazetteer
- Server-stored personal history
- Automatic difficulty reclassification

These exclusions keep the first release focused on proving the game rather than prematurely building a platform.
