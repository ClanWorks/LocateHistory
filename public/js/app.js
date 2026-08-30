// Client orchestration: fetches the generated manifest/gazetteer, wires
// the pure state machine (state-machine.js) and scoring (scoring.js) to
// the DOM, and owns the one piece of impurity the reducer deliberately
// stays out of — the round timer. See plan.md §6-§7.
import { reduce, createInitialState, Status, REQUIRED_ROUNDS } from "./state-machine.js";
import { calculateRoundScore, calculateCountryCluePenalty, haversineDistanceKm, ROUND_DURATION_MS, CLUE_COSTS, MAX_ROUND_SCORE } from "./scoring.js";
import { searchGazetteer } from "./city-search.js";
import { getHasSeenIntro, setHasSeenIntro, getBestScore, recordSessionScore } from "./storage.js";
import { createGuessMap } from "./guess-map.js";
import { createRevealMap } from "./reveal-map.js";

const gameRoot = document.getElementById("game-root");

let state = createInitialState({ hasSeenIntro: getHasSeenIntro() });
let manifest = null;
let gazetteer = null;
let itemsById = new Map();
let placesById = new Map();

let timerHandle = null;
let roundDeadline = null;
let pendingGuess = null; // {lat, lng} | null
let activeMap = null; // whichever of guess-map.js / reveal-map.js is currently mounted
// Number of gazetteer places sharing the current round's answer country —
// set once per round in renderPlaying, read by both the clue button label
// and resolveRound's scoring call so the displayed cost and the charged
// cost never drift apart. See calculateCountryCluePenalty in scoring.js.
let countryCandidateCount = null;

function dispatch(event) {
  state = reduce(state, event);
  render();
}

function currentItem() {
  if (!state.context.currentRound) return null;
  return itemsById.get(state.context.currentRound.itemId);
}

function answerCandidateIds(item) {
  return [item.location.placeId, ...item.location.acceptedPlaceIds];
}

/** Most favorable (shortest) distance between a raw {lat,lng} guess point
 * and any place id that counts as correct for this item — plan.md §12,
 * adapted for click-to-guess: the guess is no longer constrained to a
 * named gazetteer place, so this now measures against the answer's real
 * coordinates directly instead of another place's coordinates. */
function distanceToAnswer(item, guess) {
  if (!guess) return null;
  let best = Infinity;
  for (const candidateId of answerCandidateIds(item)) {
    const candidate = placesById.get(candidateId);
    if (!candidate) continue;
    const d = haversineDistanceKm(guess, candidate);
    if (d < best) best = d;
  }
  return Number.isFinite(best) ? best : null;
}

/** Nearest named gazetteer place to an arbitrary point, for reveal-screen
 * display only ("You guessed near X") — never used for scoring, which
 * always measures the guess's exact coordinates (distanceToAnswer above). */
function nearestPlaceName(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const place of gazetteer) {
    const d = haversineDistanceKm(point, place);
    if (d < bestDistance) {
      bestDistance = d;
      best = place;
    }
  }
  return best;
}

// ---------------------------------------------------------------------
// Timer — the only impure, time-based piece. Dispatches TIMER_EXPIRED
// itself rather than the reducer inferring a timeout from any other
// event, matching the design note in state-machine.js.
// ---------------------------------------------------------------------
// Screen-reader announcement thresholds, in whole seconds remaining.
// Announcing every 250ms tick would bury a screen-reader user in noise
// (plan.md §15); the visible countdown is aria-hidden and this separate
// polite region only speaks up a few times per round.
const TIMER_ANNOUNCE_THRESHOLDS = [10, 5];

function startTimer() {
  stopTimer();
  roundDeadline = Date.now() + ROUND_DURATION_MS;
  const announced = new Set();
  timerHandle = setInterval(() => {
    const remaining = remainingMs();
    updateTimerDisplay(remaining);
    const wholeSeconds = Math.ceil(remaining / 1000);
    if (TIMER_ANNOUNCE_THRESHOLDS.includes(wholeSeconds) && !announced.has(wholeSeconds)) {
      announced.add(wholeSeconds);
      announceTimer(`${wholeSeconds} seconds left`);
    }
    if (remaining <= 0) {
      stopTimer();
      resolveRound({ timedOut: true });
    }
  }, 250);
  updateTimerDisplay(ROUND_DURATION_MS);
}

function announceTimer(text) {
  const el = document.getElementById("timer-announcer");
  if (el) el.textContent = text;
}

function stopTimer() {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function remainingMs() {
  return Math.max(0, roundDeadline - Date.now());
}

// Matches the ring's r="19" in the SVG markup above (renderPlaying) —
// 2*pi*19, the circle's circumference in the same viewBox units as
// stroke-dashoffset.
const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * 19;
// Last 10s: the ring's color shift is a supplementary cue, not the only
// one — the ring is already visibly shrinking and the number is already
// counting down, so this doesn't rely on color alone for the signal.
const TIMER_URGENT_MS = 10_000;

function updateTimerDisplay(ms) {
  const el = document.getElementById("timer-remaining");
  if (el) el.textContent = String(Math.ceil(ms / 1000));

  const ring = document.getElementById("timer-ring");
  if (ring) {
    const fraction = Math.max(0, Math.min(1, ms / ROUND_DURATION_MS));
    ring.style.strokeDashoffset = String(TIMER_RING_CIRCUMFERENCE * (1 - fraction));
    ring.classList.toggle("timer-ring--urgent", ms <= TIMER_URGENT_MS);
  }
}

// ---------------------------------------------------------------------
// Round resolution — computed here (not in the reducer, which only
// stores whatever result it's given) so the scoring module stays pure
// and independently testable.
// ---------------------------------------------------------------------
function resolveRound({ timedOut, guess } = {}) {
  const item = currentItem();
  const cluesUsed = state.context.currentRound.cluesUsed;
  const remaining = remainingMs();

  if (timedOut) {
    dispatch({ type: "TIMER_EXPIRED" });
  } else {
    dispatch({ type: "GUESS_SUBMITTED", payload: { guessLat: guess.lat, guessLng: guess.lng } });
  }

  const distanceKm = timedOut ? null : distanceToAnswer(item, guess);
  const score = calculateRoundScore({
    timedOut,
    distanceKm: distanceKm ?? 0,
    remainingMs: remaining,
    cluesUsed,
    countryCandidateCount,
  });

  dispatch({
    type: "RESOLUTION_COMPUTED",
    payload: { roundScore: score.roundScore, accuracy: score.accuracy, timeBonus: score.timeBonus, cluePenalty: score.cluePenalty, distanceKm },
  });
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
function boot() {
  dispatch({ type: "BOOT_COMPLETE" });
}

/**
 * Triggered by renderLoading() itself (see below), not by boot()
 * directly — that's what makes RETRY actually retry. RETRY's recovery
 * target for a failed load is LOADING (state-machine.js), and the only
 * thing that re-enters LOADING later is this same render path, so
 * fetching-on-render is what makes a second attempt happen at all
 * instead of getting stuck on "Loading…" forever after a retry.
 */
async function loadManifest() {
  try {
    const [manifestRes, gazetteerRes] = await Promise.all([fetch("content/manifest.json"), fetch("content/gazetteer.json")]);
    if (!manifestRes.ok || !gazetteerRes.ok) throw new Error("content fetch failed");
    manifest = await manifestRes.json();
    gazetteer = await gazetteerRes.json();
    itemsById = new Map(manifest.items.map((i) => [i.id, i]));
    placesById = new Map(gazetteer.map((p) => [p.id, p]));

    if (manifest.items.length < REQUIRED_ROUNDS) {
      dispatch({ type: "MANIFEST_LOAD_FAILED", payload: { reason: "not_enough_content" } });
      return;
    }
    dispatch({ type: "MANIFEST_LOADED" });
  } catch (err) {
    dispatch({ type: "MANIFEST_LOAD_FAILED", payload: { reason: err.message } });
  }
}

function pickSessionItems() {
  const shuffled = [...manifest.items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, REQUIRED_ROUNDS).map((i) => i.id);
}

// ---------------------------------------------------------------------
// Rendering — one function per status. Each sets gameRoot's markup and
// moves focus to the new section's heading so keyboard/screen-reader
// users land somewhere sensible after every transition (plan.md §15).
// ---------------------------------------------------------------------
// Both the guessing map (renderPlaying) and the reveal map (renderReveal)
// get torn down here rather than where they're created: every render
// function replaces gameRoot's innerHTML wholesale, and MapLibre doesn't
// notice that on its own — leaving the old instance to leak its WebGL
// context and event listeners unless it's disposed explicitly first.
function disposeActiveMap() {
  if (activeMap) {
    activeMap.destroy();
    activeMap = null;
  }
}

function render() {
  disposeActiveMap();
  switch (state.status) {
    case Status.BOOT:
    case Status.LOADING:
      return renderLoading();
    case Status.INTRO:
      return renderIntro();
    case Status.SESSION_SETUP:
      return renderSessionSetup();
    case Status.PLAYING:
      return renderPlaying();
    case Status.RESOLVING:
      return; // near-instant; avoid a flash of intermediate UI
    case Status.ANSWERED:
    case Status.TIMED_OUT:
      return renderReveal();
    case Status.RESULTS:
      return renderResults();
    case Status.ERROR:
      return renderError();
  }
}

function focusHeading() {
  const heading = gameRoot.querySelector("[data-focus-target]");
  if (heading) heading.focus();
}

function renderLoading() {
  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>Loading&hellip;</h2>
    <p>Fetching the picture library.</p>
  `;
  focusHeading();
  loadManifest();
}

function renderIntro() {
  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>How to play</h2>
    <p>You'll see ${REQUIRED_ROUNDS} historical photographs, paintings, and drawings. Guess the city each one shows.</p>
    <ul>
      <li>Click the map where you think it was taken (or search for a city) before time runs out (${ROUND_DURATION_MS / 1000} seconds per round).</li>
      <li>Optional clues (region, era, country) reveal more but cost points.</li>
      <li>Closer guesses and faster answers score higher.</li>
    </ul>
    <button type="button" id="start-btn">Start playing</button>
  `;
  focusHeading();
  document.getElementById("start-btn").addEventListener("click", () => {
    setHasSeenIntro();
    dispatch({ type: "INTRO_ACKNOWLEDGED" });
  });
}

function renderSessionSetup() {
  dispatch({ type: "SESSION_READY", payload: { roundItemIds: pickSessionItems() } });
}

function renderPlaying() {
  const item = currentItem();
  const round = state.context.currentRound;
  const roundNumber = state.context.roundIndex + 1;
  const answerCountry = placesById.get(item.location.placeId)?.country;
  countryCandidateCount = answerCountry ? gazetteer.filter((p) => p.country === answerCountry).length : null;

  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>Round ${roundNumber} of ${REQUIRED_ROUNDS}</h2>
    <!-- Decorative — the ring and the number both restate what
         #timer-announcer already says to assistive tech at the same two
         thresholds, so the whole row is hidden from the accessibility
         tree rather than read twice. -->
    <div id="round-timer-row" aria-hidden="true">
      <span id="round-timer-label">Time left</span>
      <div id="round-timer">
        <svg viewBox="0 0 44 44">
          <circle class="timer-track" cx="22" cy="22" r="19"></circle>
          <circle id="timer-ring" cx="22" cy="22" r="19"></circle>
        </svg>
        <span id="timer-remaining">${Math.ceil(ROUND_DURATION_MS / 1000)}</span>
      </div>
    </div>
    <p id="timer-announcer" class="sr-only" aria-live="polite"></p>
    <!-- Fixed-height "frame" (not the image's own natural height) so
         extreme aspect ratios — a hand-cropped panorama at 17:1 is a
         real case in the pool — never render as a paper-thin sliver, and
         so the page doesn't jump in height once the image finishes
         loading (the frame reserves its space immediately). -->
    <figure id="photo-frame">
      <img src="${item.image.src}" srcset="${item.image.srcset}" sizes="(max-width: 700px) 100vw, 700px"
           width="${item.image.width}" height="${item.image.height}"
           alt="Historical image to identify" id="round-image" />
      <figcaption id="image-loading-note">Loading image&hellip;</figcaption>
    </figure>
    <div id="clue-panel">
      <p id="clue-panel-label">Clues</p>
      <div id="clue-buttons"></div>
      <ul id="revealed-clues"></ul>
    </div>
    <div id="city-selector">
      <label for="city-search-input">Guess the location</label>
      <!-- Click-to-guess map: a mouse/touch affordance only (the WebGL
           canvas MapLibre draws into isn't keyboard-operable), so it's
           hidden from the accessibility tree. The text search below is
           the fully accessible way to submit the exact same kind of
           guess — both write to the same pendingGuess {lat,lng} and
           reach the same submit button. See guess-map.js and
           wireGuessInputs(). -->
      <div id="guess-map" aria-hidden="true"></div>
      <input type="text" id="city-search-input" autocomplete="off" aria-describedby="city-search-help" />
      <p id="city-search-help">Click the map to drop a pin, or type to search for a city and choose from the list.</p>
      <!-- Deliberately a plain list of real <button> elements, not an
           ARIA listbox/combobox: role="listbox" previously claimed
           semantics (aria-activedescendant, option children, arrow-key
           navigation) that nothing here implemented. A real combobox
           pattern is more machinery than this v1 search needs — plain
           buttons are natively Tab/Enter accessible with no ARIA at
           all, which is what's actually true of this UI. -->
      <ul id="city-search-results" aria-label="City search results"></ul>
      <p id="selected-city" aria-live="polite"></p>
      <button type="button" id="submit-guess-btn" disabled>Submit guess</button>
    </div>
  `;
  focusHeading();

  // Build every control locked (disabled) first, THEN wire image
  // readiness — see below for why the order matters.
  const clueButtonsEl = document.getElementById("clue-buttons");
  for (const clue of Object.keys(CLUE_COSTS)) {
    const cost = clue === "country" ? calculateCountryCluePenalty(countryCandidateCount) : CLUE_COSTS[clue];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${clue} (−${cost} pts)`;
    btn.disabled = true; // locked until the image is ready; see onImageReady below
    btn.dataset.clue = clue;
    // Deliberately not routed through dispatch()/render(): a clue
    // request doesn't change state.status (still PLAYING), and a full
    // re-render would wipe out whatever the player had already typed
    // or selected in the city search below. Patch just the clue UI.
    btn.addEventListener("click", () => requestClue(clue, item));
    clueButtonsEl.appendChild(btn);
  }
  for (const clue of round.cluesUsed) {
    appendRevealedClue(clue, item);
  }

  const guessInputs = wireGuessInputs(item);
  const searchInput = document.getElementById("city-search-input");
  searchInput.disabled = true; // locked until the image is ready; see onImageReady below

  // The timer only starts once the image has actually finished loading
  // (or failed) — starting it immediately on insertion would cut into
  // real guessing time while the image is still downloading, worse on
  // a slow connection. img.complete can already be true here for a
  // cached image, in which case `load` will never fire, so that case is
  // checked explicitly rather than only listening for the event.
  //
  // Everything that leads to resolveRound() (clue buttons, search,
  // submit) stays disabled until then too: submitting before startTimer()
  // has run would score against roundDeadline from whatever the
  // *previous* round left behind (or null, on the very first round),
  // not this round's real deadline.
  //
  // Both callbacks are guarded by isStillThisRound(): gameRoot's
  // innerHTML gets replaced the moment a round resolves, but a slow
  // image request from an abandoned round can still fire load/error
  // later against the now-detached <img> element. Without the guard,
  // a late onImageReady would call startTimer() — which calls
  // stopTimer() first — and silently cancel and replace whatever
  // timer is running for the round the player has since moved into.
  const roundImage = document.getElementById("round-image");
  const loadingNote = document.getElementById("image-loading-note");
  const roundItemId = item.id;
  function isStillThisRound() {
    return state.status === Status.PLAYING && state.context.currentRound?.itemId === roundItemId;
  }
  function onImageReady() {
    if (!isStillThisRound()) return;
    loadingNote.remove();
    searchInput.disabled = false;
    guessInputs.activateMap();
    for (const btn of clueButtonsEl.querySelectorAll("button")) {
      btn.disabled = round.cluesUsed.includes(btn.dataset.clue);
    }
    startTimer();
  }
  function onImageFailed() {
    if (!isStillThisRound()) return;
    dispatch({ type: "ERROR_OCCURRED", payload: { reason: "image_load_failed" } });
  }
  if (roundImage.complete) {
    if (roundImage.naturalWidth > 0) onImageReady();
    else onImageFailed();
  } else {
    roundImage.addEventListener("load", onImageReady, { once: true });
    roundImage.addEventListener("error", onImageFailed, { once: true });
  }
}

function requestClue(clue, item) {
  state = reduce(state, { type: "CLUE_REQUESTED", payload: { clue } });
  const btn = document.querySelector(`#clue-buttons button[data-clue="${clue}"]`);
  if (btn) btn.disabled = true;
  appendRevealedClue(clue, item);
}

function appendRevealedClue(clue, item) {
  const li = document.createElement("li");
  li.innerHTML = `<span class="clue-key">${clue}</span><span class="clue-value">${item.clues[clue]}</span>`;
  document.getElementById("revealed-clues").appendChild(li);
}

/**
 * Wires both ways to submit a guess — the click-to-guess map and the
 * text-based city search — to the same pendingGuess {lat,lng} and the
 * same submit button, so neither is a second-class path to the same
 * outcome. The map isn't created here: it's mounted later, once the
 * image is ready, via the returned activateMap() (see onImageReady in
 * renderPlaying) — this function only wires the parts that are safe to
 * set up immediately.
 */
function wireGuessInputs(item) {
  const input = document.getElementById("city-search-input");
  const resultsEl = document.getElementById("city-search-results");
  const selectedEl = document.getElementById("selected-city");
  const submitBtn = document.getElementById("submit-guess-btn");
  pendingGuess = null;

  function selectGuess(guess, label) {
    pendingGuess = guess;
    selectedEl.textContent = `Selected: ${label}`;
    submitBtn.disabled = false;
  }

  input.addEventListener("input", () => {
    // Any real edit invalidates a prior selection — otherwise a player
    // could select San Francisco, retype "London", and still submit
    // San Francisco because pendingGuess was never cleared. Setting
    // .value programmatically (below, on selection) does not itself
    // fire this handler, so this can't immediately undo that assignment.
    pendingGuess = null;
    selectedEl.textContent = "";
    submitBtn.disabled = true;

    const matches = searchGazetteer(gazetteer, input.value);
    resultsEl.innerHTML = "";
    for (const place of matches) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `${place.displayName}, ${place.country}`;
      btn.addEventListener("click", () => {
        resultsEl.innerHTML = "";
        input.value = place.displayName;
        selectGuess({ lat: place.lat, lng: place.lng }, `${place.displayName}, ${place.country}`);
        if (activeMap) activeMap.setGuess(place.lat, place.lng);
      });
      li.appendChild(btn);
      resultsEl.appendChild(li);
    }
  });

  submitBtn.addEventListener("click", () => {
    if (!pendingGuess) return;
    stopTimer();
    submitBtn.disabled = true;
    resolveRound({ timedOut: false, guess: pendingGuess });
  });

  return {
    activateMap() {
      activeMap = createGuessMap({
        containerId: "guess-map",
        onChange: (guess) => {
          const nearest = nearestPlaceName(guess);
          const label = nearest ? `near ${nearest.displayName}, ${nearest.country}` : `${guess.lat.toFixed(2)}, ${guess.lng.toFixed(2)}`;
          input.value = "";
          resultsEl.innerHTML = "";
          selectGuess(guess, label);
        },
      });
    },
  };
}

function renderReveal() {
  const completed = state.context.roundResults[state.context.roundResults.length - 1];
  const item = itemsById.get(completed.itemId);
  const answerPlace = placesById.get(item.location.placeId);
  const guessPlace = completed.guessLat !== null ? { lat: completed.guessLat, lng: completed.guessLng } : null;
  const guessNearest = guessPlace ? nearestPlaceName(guessPlace) : null;
  const isLastRound = state.context.roundIndex + 1 >= state.context.roundItemIds.length;

  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>${state.status === Status.TIMED_OUT ? "Time's up" : "Round result"}</h2>
    <p>
      ${
        state.status === Status.TIMED_OUT
          ? `The answer was <strong>${answerPlace.displayName}, ${answerPlace.country}</strong>.`
          : guessPlace
            ? `You guessed near <strong>${guessNearest ? `${guessNearest.displayName}, ${guessNearest.country}` : "there"}</strong>. The answer was <strong>${answerPlace.displayName}, ${answerPlace.country}</strong>, ${Math.round(completed.distanceKm)} km away.`
            : ""
      }
    </p>
    <p>Score this round: <strong class="score-figure">${completed.roundScore}</strong> / 1000
      (accuracy ${completed.accuracy}, time bonus ${completed.timeBonus}, clue cost −${completed.cluePenalty})</p>
    <!-- Non-interactive (no click handler) but still a real MapLibre
         canvas, so it's hidden from the accessibility tree the same way
         as #guess-map — the paragraph above already states the guess,
         the answer, and the distance between them in text. -->
    <div id="reveal-map" aria-hidden="true"></div>
    <ul id="reveal-map-legend">
      <li><span class="legend-swatch legend-swatch--answer"></span> Correct location</li>
      ${guessPlace ? `<li><span class="legend-swatch legend-swatch--guess"></span> Your guess</li>` : ""}
    </ul>
    <figure id="reveal-thumb"><img src="${item.image.src}" alt="${item.title}" /></figure>
    <p>${item.title}${item.artistOrCreator ? ` — ${item.artistOrCreator}` : ""}, ${item.depictedDate.minYear}${item.depictedDate.minYear !== item.depictedDate.maxYear ? `–${item.depictedDate.maxYear}` : ""}</p>
    <p>${item.context}</p>
    <p class="attribution">Source: ${item.attribution.source}${item.attribution.creditText ? ` (${item.attribution.creditText})` : ""}, ${item.attribution.license}.
      <a href="${item.attribution.sourceUrl}" target="_blank" rel="noopener noreferrer">View source</a></p>
    <button type="button" id="next-btn">${isLastRound ? "See results" : "Next round"}</button>
  `;
  focusHeading();
  // answerPlace/guessPlace are always real coordinates by construction —
  // validateSourceCollection rejects any item whose placeId doesn't
  // resolve in the published gazetteer at build time, and guessPlace is
  // either null (timeout) or the exact point the player clicked/searched.
  activeMap = createRevealMap({ containerId: "reveal-map", answer: answerPlace, guess: guessPlace });
  document.getElementById("next-btn").addEventListener("click", () => dispatch({ type: "ROUND_ADVANCED" }));
}

function renderResults() {
  const results = state.context.roundResults;
  const total = results.reduce((sum, r) => sum + r.roundScore, 0);
  const { bestScore, isNewBest } = recordSessionScore(total);

  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>Results</h2>
    <p>Total score: <strong class="score-figure">${total}</strong> / ${REQUIRED_ROUNDS * 1000}</p>
    <p>${isNewBest ? "New best score!" : `Best score: <span class="score-figure">${bestScore}</span>`}</p>
    <ol id="results-breakdown">
      ${results
        .map((r) => {
          const item = itemsById.get(r.itemId);
          const place = placesById.get(item.location.placeId);
          const pct = Math.max(0, Math.min(100, (r.roundScore / MAX_ROUND_SCORE) * 100));
          return `<li>
            <div class="score-row" style="--score-pct: ${pct}%">
              <span class="score-row-fill"></span>
              <span class="score-row-label">${place.displayName}${r.reason === "timeout" ? " (timed out)" : ""}</span>
              <span class="score-row-value score-figure">${r.roundScore}</span>
            </div>
          </li>`;
        })
        .join("")}
    </ol>
    <button type="button" id="replay-btn">Play again</button>
  `;
  focusHeading();
  document.getElementById("replay-btn").addEventListener("click", () => dispatch({ type: "REPLAY_REQUESTED" }));
}

function renderError() {
  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>Something went wrong</h2>
    <p>${state.context.error?.reason ?? "Unknown error"}</p>
    <button type="button" id="retry-btn">Retry</button>
  `;
  focusHeading();
  document.getElementById("retry-btn").addEventListener("click", () => dispatch({ type: "RETRY" }));
}

boot();
