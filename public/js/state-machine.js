// Explicit game state machine. See plan.md §7.
//
//   boot -> loading -> intro -> session_setup -> playing
//   playing -> resolving -> answered | timed_out | error
//   answered | timed_out -> playing | results
//   error -> loading | playing | results
//   results -> session_setup
//
// `reduce(state, event)` is a pure function: same (state, event) in,
// same state out, no I/O, no timers, no randomness. The caller (UI layer)
// owns the countdown timer and dispatches TIMER_EXPIRED itself — the
// reducer never infers a timeout from a normal answer event, which is
// what caused the timeout/next-button bug in the previous implementation.
//
// An event that isn't valid for the current status is a no-op: the
// reducer returns the exact same state reference unchanged. This is what
// gives double-submit protection — dispatching GUESS_SUBMITTED twice, or
// TIMER_EXPIRED after a guess already resolved the round, has no effect
// the second time because the status has already moved on.

export const REQUIRED_ROUNDS = 10;

export const Status = Object.freeze({
  BOOT: "boot",
  LOADING: "loading",
  INTRO: "intro",
  SESSION_SETUP: "session_setup",
  PLAYING: "playing",
  RESOLVING: "resolving",
  ANSWERED: "answered",
  TIMED_OUT: "timed_out",
  ERROR: "error",
  RESULTS: "results",
});

const RECOVERY_TARGET_BY_STATUS = Object.freeze({
  [Status.LOADING]: Status.LOADING,
  [Status.INTRO]: Status.LOADING,
  [Status.SESSION_SETUP]: Status.LOADING,
  [Status.PLAYING]: Status.PLAYING,
  [Status.RESOLVING]: Status.PLAYING,
  [Status.ANSWERED]: Status.PLAYING,
  [Status.TIMED_OUT]: Status.PLAYING,
  [Status.RESULTS]: Status.RESULTS,
});

/** @param {{ hasSeenIntro?: boolean }} [options] */
export function createInitialState(options = {}) {
  return Object.freeze({
    status: Status.BOOT,
    context: Object.freeze({
      hasSeenIntro: Boolean(options.hasSeenIntro),
      roundItemIds: Object.freeze([]),
      roundIndex: -1,
      roundResults: Object.freeze([]),
      currentRound: null,
      error: null,
    }),
  });
}

function withContext(state, patch) {
  return Object.freeze({
    status: state.status,
    context: Object.freeze({ ...state.context, ...patch }),
  });
}

function toStatus(state, status, contextPatch = {}) {
  return Object.freeze({
    status,
    context: Object.freeze({ ...state.context, ...contextPatch }),
  });
}

function toError(state, reason, recoverTo) {
  const target = recoverTo ?? RECOVERY_TARGET_BY_STATUS[state.status] ?? Status.LOADING;
  return toStatus(state, Status.ERROR, { error: Object.freeze({ reason, recoverTo: target }) });
}

/**
 * @param {ReturnType<typeof createInitialState>} state
 * @param {{ type: string, payload?: object }} event
 */
export function reduce(state, event) {
  const { type, payload = {} } = event;

  switch (type) {
    case "BOOT_COMPLETE": {
      if (state.status !== Status.BOOT) return state;
      return toStatus(state, Status.LOADING);
    }

    case "MANIFEST_LOADED": {
      if (state.status !== Status.LOADING) return state;
      const nextStatus = state.context.hasSeenIntro ? Status.SESSION_SETUP : Status.INTRO;
      return toStatus(state, nextStatus);
    }

    case "MANIFEST_LOAD_FAILED": {
      if (state.status !== Status.LOADING) return state;
      return toError(state, payload.reason ?? "manifest_load_failed", Status.LOADING);
    }

    case "INTRO_ACKNOWLEDGED": {
      if (state.status !== Status.INTRO) return state;
      return toStatus(withContext(state, { hasSeenIntro: true }), Status.SESSION_SETUP);
    }

    case "SESSION_READY": {
      if (state.status !== Status.SESSION_SETUP) return state;
      const roundItemIds = payload.roundItemIds ?? [];
      if (roundItemIds.length !== REQUIRED_ROUNDS) {
        throw new Error(`SESSION_READY requires exactly ${REQUIRED_ROUNDS} round item ids, got ${roundItemIds.length}`);
      }
      return toStatus(state, Status.PLAYING, {
        roundItemIds: Object.freeze([...roundItemIds]),
        roundIndex: 0,
        roundResults: Object.freeze([]),
        currentRound: Object.freeze({ itemId: roundItemIds[0], cluesUsed: Object.freeze([]), guessPlaceId: null, reason: null }),
      });
    }

    case "SESSION_SETUP_FAILED": {
      if (state.status !== Status.SESSION_SETUP) return state;
      return toError(state, payload.reason ?? "session_setup_failed", Status.SESSION_SETUP);
    }

    case "CLUE_REQUESTED": {
      if (state.status !== Status.PLAYING) return state;
      const clue = payload.clue;
      const current = state.context.currentRound;
      if (!clue || current.cluesUsed.includes(clue)) return state;
      return withContext(state, {
        currentRound: Object.freeze({ ...current, cluesUsed: Object.freeze([...current.cluesUsed, clue]) }),
      });
    }

    case "GUESS_SUBMITTED": {
      if (state.status !== Status.PLAYING) return state;
      const current = state.context.currentRound;
      return toStatus(state, Status.RESOLVING, {
        currentRound: Object.freeze({ ...current, guessPlaceId: payload.guessPlaceId ?? null, reason: "guess" }),
      });
    }

    case "TIMER_EXPIRED": {
      if (state.status !== Status.PLAYING) return state;
      const current = state.context.currentRound;
      return toStatus(state, Status.RESOLVING, {
        currentRound: Object.freeze({ ...current, guessPlaceId: null, reason: "timeout" }),
      });
    }

    case "RESOLUTION_COMPUTED": {
      if (state.status !== Status.RESOLVING) return state;
      const current = state.context.currentRound;
      const completed = Object.freeze({
        itemId: current.itemId,
        cluesUsed: current.cluesUsed,
        guessPlaceId: current.guessPlaceId,
        reason: current.reason,
        roundScore: payload.roundScore,
        accuracy: payload.accuracy,
        timeBonus: payload.timeBonus,
        cluePenalty: payload.cluePenalty,
        distanceKm: payload.distanceKm ?? null,
      });
      const nextStatus = current.reason === "timeout" ? Status.TIMED_OUT : Status.ANSWERED;
      return toStatus(state, nextStatus, {
        roundResults: Object.freeze([...state.context.roundResults, completed]),
        currentRound: null,
      });
    }

    case "ROUND_ADVANCED": {
      if (state.status !== Status.ANSWERED && state.status !== Status.TIMED_OUT) return state;
      const nextIndex = state.context.roundIndex + 1;
      if (nextIndex >= state.context.roundItemIds.length) {
        return toStatus(state, Status.RESULTS);
      }
      return toStatus(state, Status.PLAYING, {
        roundIndex: nextIndex,
        currentRound: Object.freeze({
          itemId: state.context.roundItemIds[nextIndex],
          cluesUsed: Object.freeze([]),
          guessPlaceId: null,
          reason: null,
        }),
      });
    }

    case "ERROR_OCCURRED": {
      if (state.status === Status.ERROR) return state;
      return toError(state, payload.reason ?? "unknown_error", payload.recoverTo);
    }

    case "RETRY": {
      if (state.status !== Status.ERROR || !state.context.error) return state;
      const target = state.context.error.recoverTo;
      return toStatus(withContext(state, { error: null }), target);
    }

    case "REPLAY_REQUESTED": {
      if (state.status !== Status.RESULTS) return state;
      return toStatus(state, Status.SESSION_SETUP, {
        roundItemIds: Object.freeze([]),
        roundIndex: -1,
        roundResults: Object.freeze([]),
        currentRound: null,
      });
    }

    default:
      return state;
  }
}
