// Client orchestration: fetches the generated manifest/gazetteer, wires
// the pure state machine (state-machine.js) and scoring (scoring.js) to
// the DOM, and owns the one piece of impurity the reducer deliberately
// stays out of — the round timer. See plan.md §6-§7.
import { reduce, createInitialState, Status, REQUIRED_ROUNDS } from "./state-machine.js";
import { calculateRoundScore, calculateCountryCluePenalty, haversineDistanceKm, ROUND_DURATION_MS, CLUE_COSTS } from "./scoring.js";
import { searchGazetteer } from "./city-search.js";
import { project, graticuleLines } from "./map-projection.js";
import { getHasSeenIntro, setHasSeenIntro, getBestScore, recordSessionScore } from "./storage.js";

const gameRoot = document.getElementById("game-root");

let state = createInitialState({ hasSeenIntro: getHasSeenIntro() });
let manifest = null;
let gazetteer = null;
let itemsById = new Map();
let placesById = new Map();

let timerHandle = null;
let roundDeadline = null;
let pendingGuessId = null;
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

/** Most favorable (shortest) distance between a guess and any place id
 * that counts as correct for this item — plan.md §12. */
function distanceToAnswer(item, guessPlaceId) {
  const guess = placesById.get(guessPlaceId);
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

function updateTimerDisplay(ms) {
  const el = document.getElementById("timer-remaining");
  if (el) el.textContent = String(Math.ceil(ms / 1000));
}

// ---------------------------------------------------------------------
// Round resolution — computed here (not in the reducer, which only
// stores whatever result it's given) so the scoring module stays pure
// and independently testable.
// ---------------------------------------------------------------------
function resolveRound({ timedOut, guessPlaceId } = {}) {
  const item = currentItem();
  const cluesUsed = state.context.currentRound.cluesUsed;
  const remaining = remainingMs();

  if (timedOut) {
    dispatch({ type: "TIMER_EXPIRED" });
  } else {
    dispatch({ type: "GUESS_SUBMITTED", payload: { guessPlaceId } });
  }

  const distanceKm = timedOut ? null : distanceToAnswer(item, guessPlaceId);
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
function render() {
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
      <li>Search for a city and select it before time runs out (${ROUND_DURATION_MS / 1000} seconds per round).</li>
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
    <p aria-hidden="true">Time left: <span id="timer-remaining">${Math.ceil(ROUND_DURATION_MS / 1000)}</span>s</p>
    <p id="timer-announcer" class="sr-only" aria-live="polite"></p>
    <figure>
      <img src="${item.image.src}" srcset="${item.image.srcset}" sizes="(max-width: 700px) 100vw, 700px"
           width="${item.image.width}" height="${item.image.height}"
           alt="Historical image to identify" id="round-image" />
      <figcaption id="image-loading-note">Loading image&hellip;</figcaption>
    </figure>
    <div id="clue-panel">
      <p>Clues:</p>
      <div id="clue-buttons"></div>
      <ul id="revealed-clues"></ul>
    </div>
    <div id="city-selector">
      <label for="city-search-input">Guess the city</label>
      <input type="text" id="city-search-input" autocomplete="off" aria-describedby="city-search-help" />
      <p id="city-search-help">Type to search, then choose from the list.</p>
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

  wireCitySelector(item);
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
  li.textContent = `${clue}: ${item.clues[clue]}`;
  document.getElementById("revealed-clues").appendChild(li);
}

function wireCitySelector(item) {
  const input = document.getElementById("city-search-input");
  const resultsEl = document.getElementById("city-search-results");
  const selectedEl = document.getElementById("selected-city");
  const submitBtn = document.getElementById("submit-guess-btn");
  pendingGuessId = null;

  input.addEventListener("input", () => {
    // Any real edit invalidates a prior selection — otherwise a player
    // could select San Francisco, retype "London", and still submit
    // San Francisco because pendingGuessId was never cleared. Setting
    // .value programmatically (below, on selection) does not itself
    // fire this handler, so this can't immediately undo that assignment.
    pendingGuessId = null;
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
        pendingGuessId = place.id;
        selectedEl.textContent = `Selected: ${place.displayName}, ${place.country}`;
        submitBtn.disabled = false;
        resultsEl.innerHTML = "";
        input.value = place.displayName;
      });
      li.appendChild(btn);
      resultsEl.appendChild(li);
    }
  });

  submitBtn.addEventListener("click", () => {
    if (!pendingGuessId) return;
    stopTimer();
    submitBtn.disabled = true;
    resolveRound({ timedOut: false, guessPlaceId: pendingGuessId });
  });
}

function renderReveal() {
  const completed = state.context.roundResults[state.context.roundResults.length - 1];
  const item = itemsById.get(completed.itemId);
  const answerPlace = placesById.get(item.location.placeId);
  const guessPlace = completed.guessPlaceId ? placesById.get(completed.guessPlaceId) : null;
  const isLastRound = state.context.roundIndex + 1 >= state.context.roundItemIds.length;

  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>${state.status === Status.TIMED_OUT ? "Time's up" : "Round result"}</h2>
    <p>
      ${
        state.status === Status.TIMED_OUT
          ? `The answer was <strong>${answerPlace.displayName}, ${answerPlace.country}</strong>.`
          : guessPlace
            ? `You guessed <strong>${guessPlace.displayName}</strong>. The answer was <strong>${answerPlace.displayName}, ${answerPlace.country}</strong>, ${Math.round(completed.distanceKm)} km away.`
            : ""
      }
    </p>
    <p>Score this round: <strong>${completed.roundScore}</strong> / 1000
      (accuracy ${completed.accuracy}, time bonus ${completed.timeBonus}, clue cost −${completed.cluePenalty})</p>
    <p id="reveal-map-caption">Simplified world map — latitude/longitude grid only, no coastlines.</p>
    <div id="reveal-map" role="img" aria-label="Map showing the guessed and correct locations"></div>
    <ul id="reveal-map-legend">
      <li><span class="legend-swatch legend-swatch--answer"></span> Correct location</li>
      ${guessPlace ? `<li><span class="legend-swatch legend-swatch--guess"></span> Your guess</li>` : ""}
    </ul>
    <img src="${item.image.src}" alt="${item.title}" width="200" />
    <p>${item.title}${item.artistOrCreator ? ` — ${item.artistOrCreator}` : ""}, ${item.depictedDate.minYear}${item.depictedDate.minYear !== item.depictedDate.maxYear ? `–${item.depictedDate.maxYear}` : ""}</p>
    <p>${item.context}</p>
    <p class="attribution">Source: ${item.attribution.source}${item.attribution.creditText ? ` (${item.attribution.creditText})` : ""}, ${item.attribution.license}.
      <a href="${item.attribution.sourceUrl}" target="_blank" rel="noopener noreferrer">View source</a></p>
    <button type="button" id="next-btn">${isLastRound ? "See results" : "Next round"}</button>
  `;
  focusHeading();
  renderRevealMap(answerPlace, guessPlace);
  document.getElementById("next-btn").addEventListener("click", () => dispatch({ type: "ROUND_ADVANCED" }));
}

// No map-error state/transition: unlike the manifest and image fetches,
// nothing here can fail at runtime the way a network request can.
// project()/graticuleLines() are pure math over already-validated
// numbers, and answerPlace/guessPlace are always real gazetteer entries
// by construction — validateSourceCollection rejects any item whose
// placeId doesn't resolve in the published gazetteer at build time, so
// there's no "missing place" case left to handle here at runtime.
function renderRevealMap(answerPlace, guessPlace) {
  const container = document.getElementById("reveal-map");
  const width = 500;
  const height = 250;
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  // Frame the grid so it reads as a deliberate map object rather than a
  // blank area that failed to render — M5 play-test: "the map never
  // displayed, only the points on the blank view."
  const frame = document.createElementNS(svgNs, "rect");
  frame.setAttribute("x", 0.5);
  frame.setAttribute("y", 0.5);
  frame.setAttribute("width", width - 1);
  frame.setAttribute("height", height - 1);
  frame.setAttribute("class", "map-frame");
  svg.appendChild(frame);

  for (const line of graticuleLines(width, height)) {
    const el = document.createElementNS(svgNs, "line");
    el.setAttribute("x1", line.x1);
    el.setAttribute("y1", line.y1);
    el.setAttribute("x2", line.x2);
    el.setAttribute("y2", line.y2);
    el.setAttribute("class", `graticule graticule--${line.emphasis}`);
    svg.appendChild(el);
  }

  // Orientation labels on the two emphasized lines, so the grid reads as
  // a real (if simplified) map rather than an unlabeled abstract pattern.
  svg.appendChild(makeMapLabel(svgNs, 4, height / 2 - 4, "Equator"));
  svg.appendChild(makeMapLabel(svgNs, width / 2 + 4, 12, "Prime meridian"));

  const answerPoint = project(answerPlace.lat, answerPlace.lng, width, height);
  if (guessPlace) {
    const guessPoint = project(guessPlace.lat, guessPlace.lng, width, height);
    const connector = document.createElementNS(svgNs, "line");
    connector.setAttribute("x1", guessPoint.x);
    connector.setAttribute("y1", guessPoint.y);
    connector.setAttribute("x2", answerPoint.x);
    connector.setAttribute("y2", answerPoint.y);
    connector.setAttribute("class", "connector");
    svg.appendChild(connector);
    svg.appendChild(makePin(svgNs, guessPoint, "guess", "Your guess"));
  }
  svg.appendChild(makePin(svgNs, answerPoint, "answer", "Correct location"));

  container.appendChild(svg);
}

function makeMapLabel(svgNs, x, y, text) {
  const el = document.createElementNS(svgNs, "text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("class", "map-label");
  el.textContent = text;
  return el;
}

function makePin(svgNs, point, cssClass, label) {
  const g = document.createElementNS(svgNs, "g");
  const circle = document.createElementNS(svgNs, "circle");
  circle.setAttribute("cx", point.x);
  circle.setAttribute("cy", point.y);
  circle.setAttribute("r", 6);
  circle.setAttribute("class", `pin pin--${cssClass}`);
  const title = document.createElementNS(svgNs, "title");
  title.textContent = label;
  g.appendChild(circle);
  g.appendChild(title);
  return g;
}

function renderResults() {
  const results = state.context.roundResults;
  const total = results.reduce((sum, r) => sum + r.roundScore, 0);
  const { bestScore, isNewBest } = recordSessionScore(total);

  gameRoot.innerHTML = `
    <h2 tabindex="-1" data-focus-target>Results</h2>
    <p>Total score: <strong>${total}</strong> / ${REQUIRED_ROUNDS * 1000}</p>
    <p>${isNewBest ? "New best score!" : `Best score: ${bestScore}`}</p>
    <ol id="results-breakdown">
      ${results
        .map((r) => {
          const item = itemsById.get(r.itemId);
          const place = placesById.get(item.location.placeId);
          return `<li>${place.displayName} — ${r.roundScore} pts${r.reason === "timeout" ? " (timed out)" : ""}</li>`;
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
