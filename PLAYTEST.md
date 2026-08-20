# M5 play-test log

plan.md §19 called for five complete, human-played sessions at
[photolocation.pages.dev](https://photolocation.pages.dev), recording
interaction problems, content quality, score distribution, clue use,
and replay motivation, with a written decision — tune v1 further, or
begin v2 — plus prioritized follow-up work as the deliverable.

**Actual outcome:** 3 sessions were completed; sessions 4 and 5 were
intentionally skipped because replay motivation had already dropped to
zero by session 3 — itself the single most important finding this gate
was designed to surface, and further sessions would only have repeated
it. That's treated as a valid, sufficient result rather than an
incomplete gate: the five-session count in §19 was a means to get
enough signal, not an end in itself, and 3 sessions already produced a
clear, actionable decision (below). M5 is closed on that basis.

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

## Session 2 — 11 August 2026

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

## Session 3 — 11 August 2026

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

## Session 4 — not played

Skipped due to repetition

---

## Session 5 — not played

Skipped due to repetition

---

## Overall decision

**Score distribution across sessions** (3 sessions completed; 4-5
intentionally skipped, see above —
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
1. ~~**Audit all 20 published items for answers visible in the image
   itself.**~~ **Done (2026-08-12).** All 20 M2 items and all 41 Tier 1
   candidates were opened and visually inspected, not just metadata-
   checked. Confirmed spoilers pulled: Goa (`goa-plan-de-goa-1750.jpg`),
   Bogotá, Mumbai, Lagos, Odense (both the M2 and a Tier 1 candidate),
   Jaffna, Colombo, Basra, London, Oslo (a caption and separately
   legible building signage), Copenhagen (a small photochrom caption),
   Varanasi, Baghdad, Havana, Kazan, Vancouver — 16 items total across
   both batches. See `content/source/CURATION_NOTES.md` for the full
   per-item record.
2. ~~**Curate more content.**~~ **Done (2026-08-12).** The Tier 1 batch
   processed all 42 remaining Firestore records; after the spoiler
   audit, undersized-image rejections, and a graphic-content hold, the
   curated pool grew from 20 to **30** approved items.
3. ~~**Results screen: fix the double-numbering bug.**~~ **Done.**
   Dropped the redundant "Round N:" text; the `<ol>`'s own numbering is
   now the only number shown.
4. ~~**Results screen: fix the list being cut off / not obviously
   there.**~~ **Done.** The list is now a bounded, visibly-bordered
   scrollable box (same affordance pattern as the city search results),
   not an ambiguous full-page scroll.
5. ~~**Rescale scoring.**~~ **Done.** Added a 3-second grace period
   (full time bonus anywhere inside it, decaying linearly afterward —
   a true instant + fully accurate guess can now reach 1000) and scaled
   the time bonus by accuracy, so a fast-but-wrong guess earns little or
   no time bonus instead of the old flat ~200. See plan.md §12.
6. ~~**Reconsider clue costs, especially "country".**~~ **Done**, via a
   data-driven rework rather than a flat percentage: the country clue's
   cost now scales inversely with how many gazetteer places share the
   answer's country (150–400 pts, vs. the old flat 200), so it's
   expensive exactly when it's most informative (a country with only
   one or two gazetteer cities) and cheaper when it barely narrows
   anything down. See `calculateCountryCluePenalty` in scoring.js.
7. ~~**Reveal map: fix it reading as broken, not minimal.**~~ **Done**,
   via the "clearer deliberate-minimal" option rather than a real
   coastline (still avoiding the garbled-outline risk that was the
   original tradeoff): the grid now has a visible frame, "Equator"/
   "Prime meridian" labels, and an explicit color-swatch legend below
   the map instead of relying on the aria-label alone.
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
