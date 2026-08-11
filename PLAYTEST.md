# M5 play-test log

plan.md §19: five complete, human-played sessions at
[photolocation.pages.dev](https://photolocation.pages.dev), recording
interaction problems, content quality, score distribution, clue use,
and replay motivation. Deliverable: a written decision — tune v1
further, or begin v2 — plus prioritized follow-up work.

Automated E2E coverage (M4) already confirms the mechanics work
(timer, scoring, reveal, results, error/retry). This log is for
everything a script can't judge: does it feel fair, is it fun, would
you play again.

---

## Session 1 — 11 August 2026

**Interaction problems** — anything confusing, slow, or that didn't do
what you expected: 
The list of answers displayed off the bottom of the view, so wasnt clear that it was available. 
The map never displayed, only the points on the blank view.

**Content quality** — did the images/clues/context feel accurate,
well-matched to difficulty, engaging:
I liked this, the inclusion of the clues was really valuable

**Score** — total /10000, and did the score feel like it reflected how
well you actually did:
3750
The high scores were good, but too much reward was given for terrible guesses, especially fast ones.

**Clue use** — which clues you took, whether the point cost felt
right, whether they were worth it:
The country and region hints were powerful, especially when the location was in a small country. Consider a percentage drop.

**Replay motivation** — did you want to go again right after finishing:
Partly. 

**Anything else:**
A clickable map would be a big benifit over the current input method.

---

## Session 2 — DATE

**Interaction problems**:
Same issues as the previous session

**Content quality**:
Goa and Bogota images display the name.
Lots of repeats from the first session, not many images stored.

**Score**:
7460
The time penalty kicks in instantly, this means a perfect score is not possible, there should be a penalty free chance to answer the questions.

**Clue use**:
As previously.

**Replay motivation**:
Decreasing due to repeats

**Anything else:**
As above.

---

## Session 3 — DATE

**Interaction problems**:
As above.

**Content quality**:
Very repetitve now.

**Score**:
5686

**Clue use**:
country clues are my go to.

**Replay motivation**:
None

**Anything else:**
On the results screen, the display reads "4. Round 4:", this makes no sense.

---

## Session 4 — DATE

Skipped due to repetition

---

## Session 5 — DATE

Skipped due to repetition

---

## Overall decision

**Score distribution across sessions** (fill in once all 5 are done —
e.g. did scores cluster, trend up as you learned the game, swing
wildly by luck of the draw): Scores improved as i learned the images.

**Recurring interaction problems** (anything that showed up more than
once): See comments above
And 10 rounds was too much 5/6 woudl be better

**Content quality verdict** (is the 20-item seed batch good enough, or
does specific content need fixing/replacing before more is added): haha not even close

**Verified findings** (checked directly against the source images, not
just taken on the session notes):
- Confirmed: `goa-plan-de-goa-1750.jpg`'s literal title, "PLAN DE GOA",
  is printed in large text across the top of the map. As direct a
  spoiler as a piece of content can have.
- Confirmed: `bogota-vista-1887.jpg` is captioned "Colombia. — Vista de
  Bogotá" directly under the image.
- Checked `odense-braun-hogenberg-1593.jpg` as a third likely case
  (same "old map/engraving with a printed title" pattern) — it has a
  Latin caption ("Othenarum") but it's dense antique typeface, not a
  plain modern name, so it's a much weaker case. Not pulling it, but
  the full 20-item batch needs the same check applied deliberately,
  not by luck — old maps/engravings/atlas plates are exactly the
  content type where the title *is* the answer, and this wasn't caught
  during M2 curation.

**Decision: tune v1 further, or begin v2?**

**Tune v1 further.** Almost everything reported here is a bug or a
balance problem in what's already built, not a request for a new mode,
Practice filters, or a Daily Challenge (that's what "begin v2" would
actually mean per plan.md §4). The one item that reads like a v2-sized
ask — replacing the searchable city selector with a clickable map — is
a real, valid preference, but it reverses a decision plan.md §5
locked deliberately (free text vs. map-pin vs. searchable selector),
so it deserves its own explicit discussion rather than getting bundled
into a bug-fix pass. Flagged below as a considered-but-deferred item,
not dropped.

The dominant finding — replay motivation hitting zero by session 3,
sessions 4-5 skipped as a direct result — traces to one root cause:
20 items is too small a pool for repeated play (10 rounds/session
against 20 items guarantees ~50% overlap between any two sessions by
simple math, which is exactly what got reported). That's the highest-
leverage fix available, more so than anything else on this list.

**Prioritized follow-up work:**
1. **Audit all 20 published items for answers visible in the image
   itself**, not just the two confirmed above — old maps/engravings/
   atlas plates are the highest-risk category (Havana, Kazan, and any
   other "plate"/"engraving from a book" item should be checked first).
   Pull or crop anything that fails. This is a content-integrity bug,
   not polish — it breaks the actual premise of the round for whatever
   fraction of the 20 items are affected.
2. **Curate more content.** The 41 already-exported, not-yet-curated
   Firestore records (`content/source/_firestore_export_flat.json`,
   per `CURATION_NOTES.md`) are the fastest path — same pipeline as M2,
   no new sourcing work, just running the license-check-and-curate
   process against records that already exist. This is what directly
   fixes the replay-motivation collapse.
3. **Results screen: fix the double-numbering bug.** The list renders
   as `<ol>`, which the browser auto-numbers, on top of each item's own
   "Round N:" text — producing literal "4. Round 4: …". Drop one of the
   two numbering sources.
4. **Results screen: fix the list being cut off / not obviously there.**
   Needs an actual layout/scroll fix, not just "it's below the fold."
5. **Rescale scoring so a fast-wrong guess isn't nearly as rewarding.**
   Time bonus is currently earned independently of accuracy, so
   guessing immediately and randomly nets ~200 points regardless of how
   wrong it is. Also add a short grace period before the time bonus
   starts decaying — right now even an instant answer can't reach a
   true 1000, since some real reaction time always elapses first.
6. **Reconsider clue costs, especially "country".** Confirmed
   disproportionately powerful for smaller/less common countries even
   after the M2-review gazetteer expansion (20 → 173 entries). A
   percentage-of-remaining-score cost, as suggested in session 1, is
   worth prototyping against the fixed-cost model.
7. **Reveal map: fix it reading as broken, not minimal.** The
   graticule-only design was a deliberate M3 call to avoid a garbled
   landmass outline, documented as a known tradeoff at the time — but
   "the map never displayed" is exactly the failure mode that tradeoff
   risked, and it happened. Needs either a real (correct) landmass
   illustration, or a clearer deliberate-minimal presentation (labels,
   legend, something that reads as "on purpose").
8. *(Considered, deferred, not scheduled)* — a clickable map for
   **input**, replacing the searchable city selector. Real preference,
   real usability upside, but a bigger scope change than the rest of
   this list and reverses a locked v1 decision — worth a deliberate
   conversation before committing to it, not a line item in a bug-fix
   pass.
9. *(Optional, secondary)* — reducing rounds per session (10 → 5/6).
   Only worth doing if #2 (more content) turns out not to be enough on
   its own; cutting round count treats the symptom, expanding the pool
   treats the cause.
