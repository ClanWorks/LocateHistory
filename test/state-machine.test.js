import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { reduce, createInitialState, Status, REQUIRED_ROUNDS } from "../public/js/state-machine.js";

function tenIds() {
  return Array.from({ length: REQUIRED_ROUNDS }, (_, i) => `item-${i}`);
}

function playSession(state) {
  state = reduce(state, { type: "SESSION_READY", payload: { roundItemIds: tenIds() } });
  assert.equal(state.status, Status.PLAYING);
  return state;
}

describe("boot / loading / intro", () => {
  test("boot only advances on BOOT_COMPLETE", () => {
    const boot = createInitialState();
    assert.equal(reduce(boot, { type: "MANIFEST_LOADED" }), boot, "unrelated event in boot is a no-op");
    const loading = reduce(boot, { type: "BOOT_COMPLETE" });
    assert.equal(loading.status, Status.LOADING);
  });

  test("first-time player sees the intro", () => {
    const state = reduce(reduce(createInitialState({ hasSeenIntro: false }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    assert.equal(state.status, Status.INTRO);
  });

  test("returning player skips straight to session setup", () => {
    const state = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    assert.equal(state.status, Status.SESSION_SETUP);
  });

  test("manifest load failure goes to error and remembers how to recover", () => {
    const loading = reduce(createInitialState(), { type: "BOOT_COMPLETE" });
    const errored = reduce(loading, { type: "MANIFEST_LOAD_FAILED", payload: { reason: "network" } });
    assert.equal(errored.status, Status.ERROR);
    assert.equal(errored.context.error.reason, "network");
    assert.equal(errored.context.error.recoverTo, Status.LOADING);
  });

  test("acknowledging the intro sets hasSeenIntro and moves to session setup", () => {
    const intro = reduce(reduce(createInitialState(), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    const setup = reduce(intro, { type: "INTRO_ACKNOWLEDGED" });
    assert.equal(setup.status, Status.SESSION_SETUP);
    assert.equal(setup.context.hasSeenIntro, true);
  });
});

describe("session setup", () => {
  test("SESSION_READY requires exactly REQUIRED_ROUNDS ids", () => {
    const setup = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    assert.throws(() => reduce(setup, { type: "SESSION_READY", payload: { roundItemIds: ["only-one"] } }));
  });

  test("SESSION_READY rejects duplicate round item ids", () => {
    const setup = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    const ids = tenIds();
    ids[9] = ids[0]; // duplicate the first id into the last slot
    assert.throws(() => reduce(setup, { type: "SESSION_READY", payload: { roundItemIds: ids } }));
  });

  test("SESSION_READY initializes round zero", () => {
    const setup = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    const playing = playSession(setup);
    assert.equal(playing.context.roundIndex, 0);
    assert.equal(playing.context.currentRound.itemId, "item-0");
    assert.deepEqual(playing.context.currentRound.cluesUsed, []);
  });

  test("session setup failure goes to error recovering back to session setup", () => {
    const setup = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
    const errored = reduce(setup, { type: "SESSION_SETUP_FAILED", payload: { reason: "not_enough_content" } });
    assert.equal(errored.status, Status.ERROR);
    assert.equal(errored.context.error.recoverTo, Status.SESSION_SETUP);
  });
});

function freshPlayingState() {
  const setup = reduce(reduce(createInitialState({ hasSeenIntro: true }), { type: "BOOT_COMPLETE" }), { type: "MANIFEST_LOADED" });
  return playSession(setup);
}

describe("playing", () => {
  test("requesting a clue records it without changing status", () => {
    const playing = freshPlayingState();
    const withClue = reduce(playing, { type: "CLUE_REQUESTED", payload: { clue: "region" } });
    assert.equal(withClue.status, Status.PLAYING);
    assert.deepEqual(withClue.context.currentRound.cluesUsed, ["region"]);
  });

  test("requesting the same clue twice is a no-op the second time", () => {
    const playing = freshPlayingState();
    const once = reduce(playing, { type: "CLUE_REQUESTED", payload: { clue: "region" } });
    const twice = reduce(once, { type: "CLUE_REQUESTED", payload: { clue: "region" } });
    assert.equal(twice, once, "second identical clue request must not produce a new state");
  });

  test("requesting an unknown clue throws instead of silently polluting cluesUsed", () => {
    const playing = freshPlayingState();
    assert.throws(() => reduce(playing, { type: "CLUE_REQUESTED", payload: { clue: "not-a-real-clue" } }));
  });

  test("a guess moves to resolving with the guess recorded", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    assert.equal(resolving.status, Status.RESOLVING);
    assert.equal(resolving.context.currentRound.guessPlaceId, "paris");
    assert.equal(resolving.context.currentRound.reason, "guess");
  });

  test("a guess with no guessPlaceId throws instead of silently locking in null", () => {
    const playing = freshPlayingState();
    assert.throws(() => reduce(playing, { type: "GUESS_SUBMITTED", payload: {} }));
    assert.throws(() => reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "" } }));
  });

  test("a timer expiry moves to resolving with no guess and reason timeout", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "TIMER_EXPIRED" });
    assert.equal(resolving.status, Status.RESOLVING);
    assert.equal(resolving.context.currentRound.guessPlaceId, null);
    assert.equal(resolving.context.currentRound.reason, "timeout");
  });

  test("double-submitting a guess after resolving has already started is a no-op", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const again = reduce(resolving, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "london" } });
    assert.equal(again, resolving, "a second guess must not overwrite the frozen round snapshot");
  });

  test("a late timer expiry after a guess was already submitted is a no-op", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const afterTimeout = reduce(resolving, { type: "TIMER_EXPIRED" });
    assert.equal(afterTimeout, resolving, "timeout firing after a guess was locked in must not flip the outcome");
  });
});

describe("resolving -> answered/timed_out -> results", () => {
  test("RESOLUTION_COMPUTED after a guess produces an answered round", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const answered = reduce(resolving, {
      type: "RESOLUTION_COMPUTED",
      payload: { roundScore: 950, accuracy: 800, timeBonus: 150, cluePenalty: 0, distanceKm: 3 },
    });
    assert.equal(answered.status, Status.ANSWERED);
    assert.equal(answered.context.currentRound, null);
    assert.equal(answered.context.roundResults.length, 1);
    assert.equal(answered.context.roundResults[0].roundScore, 950);
    assert.ok(Object.isFrozen(answered.context.roundResults[0]), "completed round record must be frozen");
  });

  test("RESOLUTION_COMPUTED rejects a non-numeric score payload instead of storing garbage", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    assert.throws(() => reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: undefined, accuracy: 800, timeBonus: 150, cluePenalty: 0 } }));
    assert.throws(() => reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: NaN, accuracy: 800, timeBonus: 150, cluePenalty: 0 } }));
    assert.throws(() => reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 950, accuracy: 800, timeBonus: 150, cluePenalty: 0, distanceKm: "close" } }));
  });

  test("RESOLUTION_COMPUTED after a timeout produces a timed_out round", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "TIMER_EXPIRED" });
    const timedOut = reduce(resolving, {
      type: "RESOLUTION_COMPUTED",
      payload: { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty: 0, distanceKm: null },
    });
    assert.equal(timedOut.status, Status.TIMED_OUT);
  });

  test("RESOLUTION_COMPUTED is a no-op outside resolving", () => {
    const playing = freshPlayingState();
    assert.equal(reduce(playing, { type: "RESOLUTION_COMPUTED", payload: {} }), playing);
  });

  test("ROUND_ADVANCED moves to the next round", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const answered = reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 100, accuracy: 100, timeBonus: 0, cluePenalty: 0, distanceKm: 500 } });
    const nextRound = reduce(answered, { type: "ROUND_ADVANCED" });
    assert.equal(nextRound.status, Status.PLAYING);
    assert.equal(nextRound.context.roundIndex, 1);
    assert.equal(nextRound.context.currentRound.itemId, "item-1");
  });

  test("ROUND_ADVANCED after the final round goes to results", () => {
    let state = freshPlayingState();
    for (let i = 0; i < REQUIRED_ROUNDS; i++) {
      const resolving = reduce(state, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
      const answered = reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 10, accuracy: 10, timeBonus: 0, cluePenalty: 0, distanceKm: 9000 } });
      state = reduce(answered, { type: "ROUND_ADVANCED" });
    }
    assert.equal(state.status, Status.RESULTS);
    assert.equal(state.context.roundResults.length, REQUIRED_ROUNDS);
  });
});

describe("error recovery", () => {
  test("ERROR_OCCURRED from playing defaults to recovering back to playing", () => {
    const playing = freshPlayingState();
    const errored = reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "image_load_failed" } });
    assert.equal(errored.status, Status.ERROR);
    assert.equal(errored.context.error.recoverTo, Status.PLAYING);
  });

  test("ERROR_OCCURRED accepts an explicit recoverTo override, if it's a real status", () => {
    const playing = freshPlayingState();
    const errored = reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "weird_case", recoverTo: Status.RESULTS } });
    assert.equal(errored.context.error.recoverTo, Status.RESULTS);
  });

  test("ERROR_OCCURRED rejects a bogus recoverTo instead of storing it verbatim", () => {
    // A typo'd or made-up status here would otherwise get written straight
    // into context.error.recoverTo, and RETRY would transition into a
    // status no switch case matches, silently soft-locking the reducer.
    const playing = freshPlayingState();
    assert.throws(() => reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "x", recoverTo: "not_a_real_status" } }));
    // resolving and error are real Status values but must never be valid
    // recovery targets — nothing should ever "recover into" either one.
    assert.throws(() => reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "x", recoverTo: Status.RESOLVING } }), TypeError);
    assert.throws(() => reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "x", recoverTo: Status.ERROR } }), TypeError);
  });

  test("RETRY sends the player back to the recorded recovery target", () => {
    const playing = freshPlayingState();
    const errored = reduce(playing, { type: "ERROR_OCCURRED", payload: { reason: "image_load_failed" } });
    const retried = reduce(errored, { type: "RETRY" });
    assert.equal(retried.status, Status.PLAYING);
    assert.equal(retried.context.error, null);
  });

  test("RETRY outside error state is a no-op", () => {
    const playing = freshPlayingState();
    assert.equal(reduce(playing, { type: "RETRY" }), playing);
  });

  test("an error during the reveal (answered) recovers back to answered, not playing", () => {
    // Regression test: answered has currentRound === null. Recovering
    // straight to playing would leave currentRound null, and the next
    // CLUE_REQUESTED or GUESS_SUBMITTED would crash trying to read it.
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const answered = reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 950, accuracy: 800, timeBonus: 150, cluePenalty: 0, distanceKm: 3 } });
    const errored = reduce(answered, { type: "ERROR_OCCURRED", payload: { reason: "map_load_failed" } });
    assert.equal(errored.context.error.recoverTo, Status.ANSWERED);

    const retried = reduce(errored, { type: "RETRY" });
    assert.equal(retried.status, Status.ANSWERED);
    assert.equal(retried.context.currentRound, null, "answered legitimately has no currentRound");

    // Confirm no crash: an event that only makes sense in PLAYING must
    // stay a safe no-op here, not throw on a null currentRound.
    assert.equal(reduce(retried, { type: "CLUE_REQUESTED", payload: { clue: "region" } }), retried);
  });

  test("an error during a timeout reveal recovers back to timed_out, not playing", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "TIMER_EXPIRED" });
    const timedOut = reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty: 0 } });
    const errored = reduce(timedOut, { type: "ERROR_OCCURRED", payload: { reason: "map_load_failed" } });
    assert.equal(errored.context.error.recoverTo, Status.TIMED_OUT);
    assert.equal(reduce(errored, { type: "RETRY" }).status, Status.TIMED_OUT);
  });

  test("an error while resolving recovers to playing with the in-flight guess cleared for resubmission", () => {
    const playing = freshPlayingState();
    const resolving = reduce(playing, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "paris" } });
    const errored = reduce(resolving, { type: "ERROR_OCCURRED", payload: { reason: "scoring_failed" } });
    assert.equal(errored.context.error.recoverTo, Status.PLAYING);

    const retried = reduce(errored, { type: "RETRY" });
    assert.equal(retried.status, Status.PLAYING);
    assert.equal(retried.context.currentRound.guessPlaceId, null, "stale guess must be cleared, not resurrected");
    assert.equal(retried.context.currentRound.reason, null);

    // A fresh guess after recovery must work normally.
    const resolvingAgain = reduce(retried, { type: "GUESS_SUBMITTED", payload: { guessPlaceId: "london" } });
    assert.equal(resolvingAgain.status, Status.RESOLVING);
  });
});

describe("replay", () => {
  test("REPLAY_REQUESTED from results resets round state and returns to session setup", () => {
    let state = freshPlayingState();
    for (let i = 0; i < REQUIRED_ROUNDS; i++) {
      const resolving = reduce(state, { type: "TIMER_EXPIRED" });
      const timedOut = reduce(resolving, { type: "RESOLUTION_COMPUTED", payload: { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty: 0 } });
      state = reduce(timedOut, { type: "ROUND_ADVANCED" });
    }
    assert.equal(state.status, Status.RESULTS);
    const replay = reduce(state, { type: "REPLAY_REQUESTED" });
    assert.equal(replay.status, Status.SESSION_SETUP);
    assert.deepEqual(replay.context.roundResults, []);
  });
});

describe("immutability", () => {
  test("state and context are frozen", () => {
    const state = createInitialState();
    assert.ok(Object.isFrozen(state));
    assert.ok(Object.isFrozen(state.context));
    assert.throws(() => {
      "use strict";
      state.context.roundIndex = 99;
    }, TypeError);
  });
});
