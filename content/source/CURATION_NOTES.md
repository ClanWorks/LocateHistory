# M2 seed batch curation notes (2026-08-09)

## Selection

20 items were picked from the 62 exported Firestore records (`_firestore_export_flat.json`), chosen for geographic spread across South Asia, East Asia, the Middle East, Africa, Europe, North America, South America, and Oceania — enough diversity to make the `region` clue meaningful. The mislabeled `\Copenhagen` record and the remaining 41 unpicked records were left out of this batch; they're still in the raw export for a future batch.

## License verification

Every item's actual Wikimedia Commons file page (not just the Firestore record) was fetched and read before approval — plan.md §13 step 4 requires this, and "the file was already in the old Firestore collection" is not evidence of license status on its own. All 20 came back usable:

- 18 of 20: Public Domain (various bases — PD-old-100/PD-old-70 for works whose creators died long enough ago, PD-1923/pre-1931-publication US rules for LOC/Matson photographs, "no known copyright restrictions" for British Library Flickr Commons uploads, or an explicit uploader public-domain release).
- 2 of 20 (Sydney, Wellington): the underlying artwork is public domain, but the specific digital reproduction is released by the holding institution (State Library of New South Wales) under **CC BY-SA 3.0 AU** / **PD-Australia**. These carry an attribution + share-alike obligation, encoded in `attribution.creditText`.

No candidate was rejected on licensing grounds in this batch — everything checked out, so nothing needed to be left in `draft`. That won't always be true for future batches; the schema and build validation already enforce that `approved` items must have a non-empty license and sourceUrl (`scripts/lib/validate.js`), and the plan's rule stands: if a future item's license is unclear, it stays `draft` and is excluded from the manifest, not approved on a guess.

## depictedDate vs creationDate

Per item.schema.json, these are deliberately separate fields. `depictedDate` always mirrors the `year` already recorded in the original Firestore data (trusted as the prior curator's read of the scene). `creationDate` was only filled in where the Commons research gave a clear, separate answer:

- **Montevideo**: depicts the 1726 founding of the city, but the canvas itself was painted c. 1900 by Eduardo Amézaga — a real, meaningful gap, and the clearest example of why these two fields exist.
- **Accra**: Commons dates the photograph to "between 1885–1908" — an approximate range, used as-is via `{minYear, maxYear}` rather than picked arbitrarily.
- **Seoul**: illustration published 1896, in a travel account whose depicted scene is dated 1892 in the Firestore record.
- **Havana, Kazan**: Commons research surfaced a creation-date estimate that disagreed with the Firestore year by decades (Havana: "circa 1650" vs. recorded 1699; Kazan: "circa 1630" vs. recorded 1656). Rather than assert either number with false confidence, `creationDate` is `null` for both — the depicted year is kept as recorded, but exact creation year is left genuinely unresolved.
- All other items: no conflicting information was found, so `creationDate` equals `depictedDate`.

## Attribution

`artistOrCreator` (the named creator of the work) and `attribution.creditText` (the institution to credit) are separate concepts and were kept separate — several items have one but not the other (e.g. Kazan names Adam Olearius as creator but no institution credit was required; Baghdad has no named individual creator but requires crediting the Library of Congress's Matson Collection).

## Known gaps for a future batch

- Difficulty ratings (`classification.difficulty`) are a first-pass editorial judgment, not calibrated against any actual play session — plan.md §9 already expects these to move once real play-test data exists.

---

# Tier 1 follow-up batch curation notes (2026-08-11)

Triggered by the M5 play-test's #1 and #2 findings (`PLAYTEST.md`): replay motivation collapsing to zero by session 3 because a 10-round session against only 20 items guarantees ~50% overlap between sessions, and two confirmed spoiler images (`goa-plan-de-goa-1750.jpg`, `bogota-vista-1887.jpg`) that were approved in M2 without a direct visual check. This batch processed the remaining 42 records from the original Firestore export (the "41 records remain" figure in the M2 notes above was off by one — the actual count, confirmed by diffing `firestoreId`s directly, is 42) against a stricter two-gate process: real Commons license verification (as in M2) **plus a mandatory visual inspection of every candidate image itself**, not just its metadata, specifically looking for a caption or title printed on the image.

## Funnel

- **42** candidates identified (all Firestore-exported records not already in the M2 seed batch).
- **41** passed license verification. The one rejection (Victoria Terminus, Bombay, `wquUYnM6bBs31jPB7JxR`) carries only a PD-India tag on Commons with an explicit "requires a US public domain tag as well" warning and an ambiguous "late 1930s" date — not cleared.
- **12** of those 41 were rejected after visual inspection for a caption or title baked directly into the image, printed in the margin or overlaid on the scene — the exact pattern later confirmed in Goa/Bogotá:
  - `mumbai-fort-1672.jpg` — "Engels Comtoor op Bombaij" printed in the bottom margin.
  - `lagos-1892.png` — "LAGOS." printed directly under the image.
  - `odense-staden-1865.jpg` — "Staden Odense på Fyen, sedd från Allerups Maskinfabrik" printed below the image.
  - `jaffna-birds-eye-1658.jpg` — "AFBEELDINGE VAN 'T CASTEEL ENDE DE STAD JAFFENAPATNAM" across the top.
  - `colombo-after-kip-1775.jpg` — "De Stadt COLOMBE" banner across the top.
  - `basra-mss-eur-1908.jpg` — "The 'Ashshār creek in Basrah Town." printed below the image.
  - `london-panorama-1751.jpg` — "A general View of the City of LONDON and the River Thames..." printed in the bottom margin.
  - `oslo-lamotte-1813.jpg` — "Vue proche de Christiania" printed below the image (Christiania being Oslo's pre-1925 name — still a direct place-name spoiler).
  - `oslo-tekniske-skole-1900.jpg` — the school's name is legibly carved into the building's own pediment; excluded out of caution even though it's incidental architectural signage rather than a curator's caption.
  - `copenhagen-kbh-1900.jpg` (the `\Copenhagen` typo record — resolves the M2 notes' open question by simply not curating it) — small but legible "...KJØBENHAVN" text in the bottom-left corner.
  - `varanasi-brahmin-garland-1832.jpg` — "BENARES. A Brahmin placing a Garland on the holiest Spot in the sacred City." printed below the image.
  - `baghdad-parsons-1808.jpg` — "View of Bagdad or the Persian side of the Tigris." printed below the image.
- **1** further item (`kazan-capture-1894.jpg`, a 19th-century history painting of the 1552 siege of Kazan) was held back for graphic content — it depicts a body falling from a window and corpses on the ground — a content-appropriateness call, not a license or spoiler issue.
- Of the remaining **28**, **10** turned out to be below the 480px minimum dimension on at least one side once actually decoded (`content/schemas` / `scripts/lib/media.js` enforce this at build time, not at curation time, so this was only caught when `npm run build:content` refused them): `kathmandu-market-1920.jpg`, `dhaka-city-1861.png`, `karachi-04c-1930.jpg`, `karachi-st-joseph-1910.jpg`, `antananarivo-tombs-1885.jpg`, `karachi-old-1830.jpg`, `singapore-victoria-dock-1890.jpg`, `varanasi-river-1883.jpg`, `colombo-independence-1947.jpg`, `hong-kong-city-of-victoria-1865.jpg`. A further item, `lucknow-palace-gates-1801.jpg`, failed the same check (451×300). These are genuinely low-resolution scans on Commons — no higher-resolution version exists — so they were dropped rather than upscaled.
- **17 items initially approved** (41 − 12 spoilers − 1 graphic hold − 11 undersized), bringing the pool from 20 to 37 — see the correction below: 3 more were pulled on review, landing the pool at **34**.

## New gazetteer entries

Four new cities were added to `gazetteer.json` (173 → 177 entries) to support this batch: Kabul (Afghanistan — the batch's first Central Asian entry and first Afghan entry), Pondicherry (India), and Santiago, Chile was already present as `santiago-cl` (distinct from the pre-existing `santiago-de-cuba-cu`) so no addition was needed there. Lucknow and Antananarivo were also added but ended up with no approved items in this batch (Lucknow's only candidate was too small; Antananarivo's only candidate was too small) — both are kept as valid decoy/future-use gazetteer entries rather than removed.

## Content warnings

`copenhagen-shellhuset-1945.jpg` carries a `contentWarning` (wartime destruction — a building on fire following the RAF's Operation Carthage bombing raid, 21 March 1945; no visible casualties). This is curator-only editorial metadata, deliberately excluded from the published manifest (plan.md §10) — v1 has no content-filtering or warning-display UI, so nothing shows this to players. It exists to document why the item was a deliberate include-with-caveat, not a feature.

## Attribution note

`mexico-city-paseo-viga-1642.jpg` is the batch's one CC BY-SA 4.0 item (donated to Commons by Museo Soumaya) rather than public domain — carries an attribution + share-alike obligation, encoded in `attribution.creditText`.

## Correction (2026-08-12): two M2 spoilers and one non-identifiable item pulled

The Tier 1 batch above added 17 new items but left three pre-existing M2 items untouched, even though `PLAYTEST.md` had already confirmed they shouldn't ship. All three are now removed from `items.json` and their originals deleted:

- `bogota-vista-1887.jpg` (`fs-flafyeiexdqd3rsfe5wz`) — confirmed spoiler, captioned "Colombia. — Vista de Bogotá" directly under the image. Documented as a finding in `PLAYTEST.md` at M5 but never actually pulled from `items.json` — an oversight this correction fixes.
- `goa-plan-de-goa-1750.jpg` (`fs-i7eevciedrz0e4dhqvjx`) — confirmed spoiler, titled "PLAN DE GOA" printed across the top of the map. Same oversight as above.
- `goa-codice-casanatense-1540.jpg` (`fs-5rfjhth1bzwwkhmiuxr3`, added in the Tier 1 batch above) — not a spoiler, but on review has no architectural or landscape content at all (a pure costume study of two figures against a blank ground), so there is no fair visual basis for a player to identify Goa from it. The item's own `context` field already said as much ("though it shows no architecture or landscape") without that being treated as disqualifying at the time — it should have been.

Net effect: the curated pool is **34** (37 from the Tier 1 batch, minus these 3), and the gazetteer's `goa-in` entry now has zero approved items (kept as a valid future-use/decoy entry, not removed).

## Full spoiler audit of the remaining original M2 items (2026-08-12)

The correction above only re-checked the two items `PLAYTEST.md` had already flagged. Follow-up item #1 on the play-test list ("audit all published items for answers visible in the image itself") was still only partially done — of the M2 seed batch's other 18 items, only `odense-braun-hogenberg-1593.jpg` had been looked at (in M5, as a "weaker case," and not pulled at the time). The other 17 had never been opened and inspected. All 18 were now checked directly, applying the same bar used throughout the Tier 1 batch: any legible caption or title naming the depicted place, in any language or period typeface, is a reject — a landmark or building name (Fort William, Imperial Hotel) is not, since it doesn't hand a player the city itself.

Four more confirmed spoilers, removed the same way as the correction above:

- `odense-braun-hogenberg-1593.jpg` (`fs-ainmquqvrbjrpyr0jxhf`) — titled "CIVITATIS EPISCOPALIS OTHENARUM SIVE OTTHONIAE..." across the top; "Othenarum"/"Otthoniae" are Latin forms of Odense. This is the same item the M5 log called "a much weaker case" and chose not to pull — revisited here because leaving it in was inconsistent with rejecting `oslo-lamotte-1813.jpg` in the Tier 1 batch for the historical-name caption "Vue proche de Christiania," which is exactly the same pattern (a period/historical name for the city, not its modern English name, still legible and still identifying).
- `havana-panorama-17th-century.jpg` (`fs-gdmnp3qxdritrpuku4kn`) — "HAVANR" (stylized "HAVANA") in a cartouche at the top.
- `kazan-olearius-1656.jpg` (`fs-bgvtpznqa9idpj5ss65j`) — captioned "Casan Tartarorum" ("Kazan of the Tartars") on the plate.
- `vancouver-fairview-1904.jpg` (`fs-ew10gpluzoe9ikpp2o3j`) — a photochrom-style print with "VANCOUVER, B.C. FROM FAIRVIEW" printed directly in the bottom-left corner.

The other 14 (Kolkata, San Francisco, Manchester, Sydney, Varanasi bathing ghat, Baghdad mosque, Wellington, Lahore street scene, Prague, Accra, Kampala, Durban, Montevideo, Seoul) were confirmed clean.

Net effect: the curated pool is **30**. Havana and Vancouver each lose their only approved item and now have zero items in the pool (both gazetteer entries kept as decoys, not removed) — a real cost of applying the standard consistently, but the alternative is knowingly shipping a spoiler because it happens to be in a dead language.

## Known gaps for a future batch

- 5 of the 12 spoiler-text rejections above are old maps/engravings with a caption printed in a distinctly separate margin (Mumbai, Lagos, Odense, Jaffna, London) — these might be salvageable by cropping the caption strip out, which the current build pipeline has no step for. Not attempted in this batch; a real option for a future one if the pool needs to grow further.
- The 1 item held for graphic content (`kazan-capture-1894.jpg`) and the 1 held for incomplete license (`wquUYnM6bBs31jPB7JxR`, Victoria Terminus Bombay) were both genuinely evaluated and excluded, not left unprocessed — everything from the 62-record Firestore export has now been through this pipeline at least once. Any further growth needs either the cropping approach above or genuinely new sourcing beyond the original export, per the M5 play-test follow-up list.
- Difficulty ratings for this batch are, as with M2, first-pass editorial judgment pending real play-test data.

---

# Tier 2 batch curation notes (2026-08-12): new sourcing beyond Firestore

Every record in the original 62-record Firestore export had, by this point, been evaluated at least once (approved, rejected, or held) — see the "Known gaps" note directly above. Growing the pool further meant genuinely new sourcing, not re-processing the same export. This batch found candidates by browsing Wikimedia Commons categories directly (`Category:<City> in the 19th century` and similar), prioritized for geographic diversity against the post-Tier-1 pool's real gaps: no East or Southeast Asia beyond Seoul, no Southern Europe, no Central Europe beyond Prague, no Russia beyond Kazan, and thin Africa/South America coverage.

Same two-gate process as every prior batch — real Commons license verification, then a direct visual inspection of every image for baked-in spoiler text — applied identically to new sourcing.

## Funnel

- **17** candidates identified, one per city, across Tokyo, Rome, Cairo, Bangkok, Buenos Aires, Shanghai, Stockholm, Istanbul, Cape Town, Rio de Janeiro, Vienna, Moscow, Manila, Batavia/Jakarta, Algiers, Melbourne, and Lima.
- **17/17** passed license verification (a mix of PD-old/PD-life-plus-N, PD-1923/pre-1931-US-publication, LOC "no known restrictions," one PD-Norway50, and one CC BY 2.0 photochrom print; the Cairo painting's photograph carries CC BY-SA 4.0 like the Tier 1 Mexico City item).
- **1** (Melbourne, `Melbourne_1880_by_Samuel_Calvert.jpg`) was below the 480px minimum (600×338) once decoded — no higher-resolution alternative was found on Commons in the time available. Dropped; Melbourne remains a real gap.
- **3** of the remaining 16 were rejected after visual inspection for a caption printed directly on the image — the same pattern as every prior batch:
  - `tokyo-kyobashi-bridge-1890.png` — "V 33 KYOBASHI TOKYO" printed in the bottom-right corner.
  - `buenos-aires-panoramica-1890.jpg` — "...BUENOS AIRES VISTA PANORAMICA" printed in the bottom-left corner.
  - `rio-guanabara-bay-1895.jpg` — "CAPITAL — RIO tomado de NICTHEROY — ... Rio de Janeiro" printed across the bottom.
- **13 items were approved**: Rome, Cairo, Bangkok, Shanghai, Stockholm, Istanbul, Cape Town, Vienna, Moscow, Manila, Batavia (Jakarta), Algiers, and Lima. Pool: 30 → **43**.

One judgment call worth recording: the Rome photo's storefront signage reads "MILANO" (a shop advertising a Milan branch) and "OPIFICIO... MAGAZZINI DI VENDITA MILANO" — this is real in-scene signage, not a curator's caption, and it names the *wrong* city (Milan, not Rome). It's a potential red herring for an unusually observant player, not a spoiler, so it wasn't disqualifying — flagged here in case it comes up in a future play-test.

## Gazetteer

No new gazetteer entries were needed — all 13 approved cities already existed as decoy entries in the 177-entry gazetteer from earlier curation passes. One update: added "Batavia" to `jakarta-id`'s `historicalNames`, since the Kali Besar item depicts colonial-era Batavia under that name.

## Known gaps for a future batch

- Melbourne has no approved item; a higher-resolution 1880s–1890s Collins Street or Bourke Street photograph likely exists on Commons but wasn't found in this pass.
- Region coverage after this batch: 17 distinct `classification.region` values across 43 items, up from 14 across 30. Still thin or absent: Central America, most of the Caribbean, the Pacific Islands beyond Australia/NZ, and Scandinavia beyond Denmark/Norway/Sweden's one Stockholm entry.
- This batch searched by city name via Commons category browsing — a systematic pass through Commons' own "19th-century photographs of [country]" category tree would likely surface more candidates per city (multiple angles, decades) than this single-image-per-city approach did.

---

# Tier 3 batch curation notes (2026-08-13): parallel-sourced, 43 → 111

Triggered by an explicit push for volume ("we need content and lots of it," "think 100s"). Given the scale, sourcing was parallelized across 5 independent research agents, each assigned ~15 cities across a distinct region (Americas/Caribbean, Western/Northern Europe, Eastern Europe/Middle East, Africa, Asia) and given the exact same two-gate process used in every prior batch verbatim: find a wide cityscape/street/harbor candidate on Commons, verify its license against the actual File: page, download it, check resolution ≥480px both dimensions, and — non-negotiably — visually inspect the downloaded image via the Read tool for any legible text baked into the image naming the depicted place, in any language or historical name, before reporting it approved.

## Process notes specific to this batch

- **Two agent runs were interrupted mid-task** by a session restart; their work wasn't lost (files already on disk, per plan.md's originals being local not committed) but 2 of 5 lost their conversation transcripts and had to be relaunched fresh, pointed at the partial downloads already present so they wouldn't repeat search work. The 2 that kept their transcripts (Americas/Caribbean, Western/Northern Europe) resumed cleanly.
- **Centralized re-verification, not blind trust of agent self-report.** Every item's `attribution.sourceUrl` and license were independently re-derived and re-confirmed against the actual Commons file page by the coordinating session — not copied from agent prose — because two of the five agents' final reports omitted a source-URL column entirely. This surfaced real gaps: 4 approved-by-agent candidates (Santo Domingo, Monrovia, Maputo, Windhoek) could not be re-matched to a specific, confirmable Commons file after real effort and were dropped rather than shipped with a guessed or unverifiable citation, even though their images were already confirmed visually clean.
- **A personal visual spot-check** (18 images, sampled across all 5 batches, prioritizing the highest-risk categories — old engravings, photochrom prints, postcards) was run in addition to the agents' own reported Read-tool inspections, specifically because one agent (Africa) deviated from the established "reject, don't crop" precedent by cropping 6 spoiler-captioned images instead of discarding them. All 6 crops were re-inspected directly and are genuinely clean; this is the first batch where cropping was used and accepted, a real process change worth flagging for future batches.
- **One agent-approved item was overridden on inspection**: the Eastern Europe/Middle East agent's Sana'a candidate was dated 2014 — a modern photograph, not historical content, which fails the project's basic premise regardless of its (correctly reported) clean license and clean spoiler check. Dropped.
- **Two cities remain genuinely unresolved after real effort**, not merely unattempted: La Paz and Valparaíso. Every plausible period source found for either city baked the city's name into the image one way or another (a postcard caption, a photographic negative-plate etching, or an artist's inscription directly on the canvas) — three separate candidates were tried and rejected for each.

## Funnel

- **75** candidate cities assigned across the 5 batches.
- Of those, license-clear, spoiler-clean images were found and independently re-verified for **68** cities: 12 Americas/Caribbean, 15 Western/Northern Europe, 14 Eastern Europe/Middle East, 12 Africa, 15 Asia.
- **7** were dropped after agent approval for reasons other than a failed spoiler/license check: Sana'a (non-historical image), Santo Domingo / Monrovia / Maputo / Windhoek (sourceUrl could not be independently re-confirmed), La Paz / Valparaíso (no clean candidate exists after multiple genuine attempts).
- Numerous further candidates were rejected by the agents themselves during sourcing for baked-in spoiler text before reaching a clean final pick — see each agent's individual findings; representative examples include Kyoto (multiple candidates rejected for "KIOTO" stamped in the corner, a systematic pattern in that city's studio photography), Baku (a postcard captioned "Баку" directly), Chennai and Hyderabad (stale pre-existing downloads that couldn't be matched to any real Commons source were discarded and replaced with fresh, verified candidates).
- **68 items were approved**, bringing the pool from **43 to 111**.

## Gazetteer

18 new entries added (177 → 195): Panama City, Guatemala City, Recife, Quebec City, Munich, Hamburg, Barcelona, Gothenburg, Bergen, Sofia, Muscat, Baku, Tbilisi, Zanzibar City, Hyderabad, Guangzhou, Nagasaki, Kyoto. All other approved cities already existed as decoy entries from earlier batches.

## Region coverage

20 distinct `classification.region` values across 111 items (up from 17 across 43), with genuinely new coverage in East Asia, Southeast Asia, the Caucasus, Central America, and the Caribbean — regions that were entirely or nearly absent before this batch.

## Known gaps for a future batch

- The 7 dropped-after-approval cities above are real, specific targets for a focused follow-up: each already has a known, license-checked, visually-clean candidate (or, for La Paz/Valparaíso, a documented reason every attempt so far has failed) — this is faster to close than fresh sourcing from zero.
- Melbourne (carried over from Tier 2) is still unresolved.
- The Pacific Islands beyond Australia/NZ, and most of Central Asia beyond Kabul, remain thin or absent.
- Difficulty ratings for this batch are, as with every prior batch, first-pass editorial judgment pending real play-test data — and this batch in particular never got a human spot-check of gameplay feel, only content-integrity checks.

---

# Wave 2 (2026-08-23): the "think 1000" push, 111 → 274

Explicit instruction to keep scaling volume ("i think 1000 is a reasonable target"). Sourcing was parallelized across 10 research agents, each covering ~15-20 cities in a distinct region, using the exact same two-gate process as every prior batch: real Commons license verification against the actual file page, then a mandatory visual inspection for baked-in spoiler text before approval.

## Process notes specific to this wave

- **Session interruption mid-run.** Partway through, all 10 agents' sessions were affected by a genuine multi-day gap (the harness restarted); 2 of 10 agents recovered cleanly from their saved transcripts when resumed, and 4 more hit outright API/network failures (`ENOTFOUND`) rather than the earlier Wikimedia-rate-limit pattern. All 4 of those had already saved real progress to `content/originals/` before failing, so 4 small follow-up agents were launched pointed at exactly the missing remainder (e.g. "you did 13 of 18 cities, finish the other 5") rather than restarting from scratch. Only one batch (retries + small European capitals) had made zero download progress and needed a genuine fresh start.
- **Centralized re-verification remained non-negotiable**, same as Wave 1: every `sourceUrl`/license was checked or re-derived directly against the Commons file page, not taken from agent prose alone. This is what caught a real problem the agents themselves reported cleanly but that still needed a judgment call: **Lusaka's only candidate is a 2008 photograph** — the agent's own report flagged this (no clean pre-1970 candidate exists for a city founded in 1935) rather than hiding it, but a modern photo still fails the game's basic "historical" premise regardless of a clean license and spoiler check, so it was dropped, matching the earlier Sana'a-2014 precedent from Wave 1.
- **A second, more serious issue surfaced on personal re-inspection, not from any agent report**: the Middle East/Central Asia batch's Sana'a candidate — a different one from Wave 1's rejected 2014 photo, sourced this time from a non-institutional Yemeni heritage-photo website — has a visibly blurred/pixelated rectangular patch inside the image itself. The agent's report called this a probable print/moiré artifact and moved on; direct visual inspection did not find that explanation convincing enough given the combination of weak provenance and an unusual-looking artifact, so it was rejected. Yemen has no item in the pool as a result — a deliberate omission, not an oversight.
- **One further agent-approved image was independently rejected on inspection**: a Mosul candidate (LOC Matson Collection) has an illegible cursive annotation in the photo's margin that could not be confidently ruled out as naming the city. The agent's own report had already rejected two *other* Mosul candidates for exactly this failure mode (a printed "Mosul." caption, and separately an "ambiguous Arabic handwriting" case treated the same cautious way) — this third candidate got the same treatment for consistency. Mosul has no item in the pool.
- **Wikimedia's rate limiting became the dominant practical constraint** for the South Asia and Middle East/Central Asia batches specifically: both agents did real, complete research (candidate found, license verified against the real Commons page, exact sourceUrl recorded) for cities where the download-and-visually-inspect steps kept failing with HTTP 429s. Rather than either approving on research alone (a hard no — the visual check is the whole point) or discarding the research, those items were finished centrally: 6 of Middle East's 9 stalled candidates and all 4 of a further round were downloaded and inspected directly (`Erbil`, `Jaffa`, `Samarkand`, `Bukhara`, `Haifa`, `Alexandria`, `Port Said`, `Riyadh`, `Jeddah` all cleared this way), bringing that batch to 16 of 18 cities. **12 of South Asia's 14 stalled candidates could not be completed** before rate-limiting became severe enough (`Retry-After: 600`) that continuing wasn't a good use of the session — those 12 (Pune, Surat, Indore, Amritsar, Srinagar, Kanpur, Patna, Bhopal, Multan, Rawalpindi, Quetta, Chittagong, Kandy, Jaffna) are genuinely research-complete and ready for a fast follow-up pass: real license-verified sourceUrls exist for all of them, only the download+inspect steps remain.

## Funnel

- ~189 candidate cities assigned across the 10 batches.
- **163 items were approved** and integrated after the full pipeline (agent sourcing + centralized re-verification, including the South Asia/Middle East finishing work above). Pool: 111 → **274**.
- Explicitly excluded despite an agent reporting a clean result: Lusaka (non-historical image), Sana'a (unresolved authenticity concern on personal inspection), Mosul (unresolved spoiler-text concern on personal inspection).
- No clean candidate exists at all: Doha (every pre-1940 image found is either too small or has "DOHA(CENTRAL)" stamped on it).
- Held for a fast follow-up (research complete, download+inspect remaining): 12 South Asia cities — see above.
- Two rejected-and-cropped candidates were used this wave, in addition to the six already used in a prior batch: Zurich (a Photoglob-Wehrli plate with "ZÜRICH. Sonnenquai." printed in the border, cropped and re-verified clean) and, in the retry batch, Stavanger and Luxembourg City (both postcards/plates with a printed caption strip, cropped and re-verified clean). All three were personally re-inspected after cropping, not just trusted from the agent's own claim.

## Gazetteer

123 new entries proposed, 118 actually new after dedup against a handful already present (177 → ~295), plus one entry (`frankfurt-de`) that was missed in the initial batch and caught by the build's own cross-reference check before the final build — 314 gazetteer entries total. New coverage includes essentially all of interior China, Japan beyond Kyoto/Nagasaki/Tokyo/Osaka/Shanghai, the whole of Western/Southern/Eastern Europe's second-tier capitals, most of Central Africa, most of interior South America, and the wider Pacific (Fiji, Samoa, Tonga, Papua New Guinea, New Caledonia, French Polynesia).

## Region coverage

21 distinct `classification.region` values across 274 items, up from 20 across 111. 270 distinct cities across those 274 items — the pool is now close to one-item-per-city rather than concentrated in a few well-covered capitals, which was a deliberate choice given how much of Wave 1's growth came from adding depth to already-covered cities.

## Known gaps for a future batch

- The 12 held South Asia cities (see above) are the fastest possible next increment — no new research needed, just execute the pipeline's last two steps once Wikimedia's rate limit clears.
- Yemen (Sana'a) and Qatar (Doha) have no item and no immediately obvious clean candidate; both would need genuinely fresh sourcing attempts, not a retry of what's already been tried.
- Getting toward "1000" from here will need either (a) many more waves at this same breadth-first pace, which faces diminishing returns as fewer never-covered cities remain, or (b) a deliberate shift to depth — a second or third image for cities already in the pool (Paris, London, Rome, etc. almost certainly have many more qualifying Commons candidates each) — which hasn't been attempted at all yet.
- As with every prior batch, difficulty ratings are first-pass editorial judgment pending real play-test data, and this wave in particular has had zero human playtesting at its new scale.

### Post-hoc audit correction (same day)

Transcribing ~163 items by hand from 10 large agent reports into the seed script is exactly the kind of step where copy errors happen, so `content/originals/` was audited against `items.json` after the main build to check for any approved-but-never-transcribed files. It found 4: Riyadh, Aarhus, and Buenos Aires had real, complete agent research (including a citable sourceUrl already recorded above) and were simply missed when the script was written — added in a small follow-up pass, pool 274 → **277**. The fourth, Bilbao, could not be re-matched to a specific Commons source on re-check (the two most likely Commons candidates for its filename both turned out to be unrelated modern photos) — dropped rather than shipped with a guessed citation, consistent with every prior instance of this same judgment call in this project.

---

## Crop-salvage batch (2026-08-23): revisiting old spoiler rejections instead of writing them off

By this point in the project, "printed caption/title names the city" had become the single most common rejection reason across every batch (12 in the Tier 1 follow-up batch alone, several more in Tier 2 and Wave 2). Rather than treating every one of those as permanently dead, this batch went back through the documented rejection list and asked, city by city: is the caption in a separate margin from the picture, such that it can be cropped out entirely rather than just blurred or redacted? (A blur/redaction patch was explicitly rejected as an option — it looks obtrusive and can paradoxically flag "the answer was here," which is exactly what happened with an unrelated Sana'a candidate rejected earlier for having a suspicious blur.) This is the same crop-and-re-verify technique already used successfully 9 times in earlier batches (Dakar, Monrovia, Nairobi, Maputo, Tunis, Khartoum, Zurich, Stavanger, Luxembourg City) — this batch applied it deliberately and systematically for the first time, and prioritized cities with **zero** existing coverage over adding a second image to an already-covered city.

Three previously-blocked cities were recovered this way, closing three real gaps:

- **Mosul** — the original rejected candidate's local file could not be re-matched to any verifiable Commons source on re-check (the exact failure mode already seen once with Bilbao), so rather than guess, a fresh candidate was sourced and verified from scratch: "Iraq. Mosul. General view with tall minaret in center of picture" (LOC Matson Collection, `matpc.16200`, PD-US-no-notice). The scan has a handwritten "Mosul" and a negative number in the film mount's border, entirely outside the photographed scene — cropped out cleanly, leaving a rooftop view toward the leaning minaret of the Great Mosque of al-Nuri.
- **Tokyo** — `tokyo-kyobashi-bridge-1890.png` (Commons, CC-PD-Mark), rejected for a printed "V 33 KYOBASHI TOKYO" caption box in the bottom-right corner of the print. Cropped by trimming the bottom ~7% of the frame, which removes the caption while keeping the rest of the street scene (rickshaws, a horse tram, telegraph poles) intact. In-scene Japanese shop signage elsewhere in the frame does not name the city and isn't disqualifying, per the established red-herring-signage precedent from the Rome "MILANO" case.
- **Jaffna** — `AMH-4491-NA_Bird's_eye_view_of_the_city_of_Jaffnapatnam.jpg` (Nationaal Archief via Commons, PD-US pre-1931), a 1658 Dutch survey drawing rejected for a title reading "AFBEELDINGE VAN 'T CASTEEL ENDE DE STAD IAFFENAPATNAM" across the top. Unlike the Goa map rejected earlier in this pool — where the title is stamped directly across the map content itself — this sheet's title, two blocks of cursive marginalia, and legend table all sit in blank parchment separate from the fort-and-city illustration on the right side of the sheet, so a tight crop to just that illustration removes every piece of text while leaving the drawing intact. Single-letter map-key labels (A, D, E, H, etc.) remain in the crop; these are legend references, not place names, and aren't disqualifying.

All three were downloaded fresh from a re-verified Commons `sourceUrl` (not reused from the original rejection's notes) and personally re-inspected post-crop before approval — same standard as every other item in this pool. Pool: 277 → **280**. One new gazetteer entry added (`jaffna-lk`); Mosul and Tokyo already had entries.

**Not attempted this batch, and worth flagging as a real limit of the technique**: most of the other documented rejections with a separable-margin caption (Mumbai, Lagos, Odense, London, Basra, Copenhagen, Varanasi, Baghdad, Colombo, Oslo) are cities that already have at least one other approved item in the pool — salvaging those would add *depth*, not close a *gap*, so they were deprioritized in favor of the three genuine zero-coverage cities above. They remain a viable option for the "shift to depth" lever already flagged as a path toward 1000. Also not croppable by this method at all: Goa (title stamped across the map content, not a separable margin — already excluded, not revisited), the Sana'a blur-artifact candidate (not a caption problem — the concern is the image content itself, which cropping can't fix), and the Mosul handwritten-margin candidate that was independently rejected in Wave 2 (superseded by the fresh Mosul candidate sourced this batch instead of being revisited directly).

---

## Wave 3 (2026-08-23): "roll" — 11 parallel agents, 280 → 367

Directly following the crop-salvage batch above, the user said "it seems sensible just to let you roll," read as standing authorization to keep pushing toward 1000 autonomously rather than stopping after each small batch. 11 `general-purpose` agents were launched in parallel, each targeting either a thin region (Central America, Caucasus + Central Asia, East Africa, Caribbean, Central Africa, Southern Africa, Southeast Asia, or the 12 originally-held South Asia cities) or a depth pass (North America, Western/Central Europe, Northern/Eastern/Southern Europe), using the same two-gate license+spoiler-check process as every prior batch, spelled out explicitly in each agent's prompt.

### What happened operationally
Running 11 agents against Wikimedia concurrently reliably saturated `upload.wikimedia.org`'s rate limit (`429`, `Retry-After: 600`) for the whole session. Several agents responded correctly to the rate limit — moved to the next city, kept researching (license + sourceUrl) via `WebFetch` (which routes differently and wasn't throttled), and delivered a full "stalled" report — but a recurring subset fell back into the same "I'll wait for the rate limit to clear" pattern flagged in earlier sessions, this time via a self-described background polling loop rather than a bare wait. Each case was corrected the same way as before: an explicit `SendMessage` telling the agent this is its final turn and to report exactly what it had actually completed, not to attempt further downloads. This recovered a complete, honest status (approved / rejected-with-reason / stalled-with-full-research) from every agent rather than losing the stalled cities' research to an abandoned turn.

### Centralized finishing pass
Rather than leave "stalled" candidates undone, the curator personally worked through the great majority of them once agent traffic eased and the rate limit cleared for direct requests: downloading each from its agent-supplied `sourceUrl` (re-deriving the correct upload URL via `WebFetch` when a guessed path 404'd), visually inspecting it, cropping where the caption sat in a separable margin (many more instances of the same book-plate and postcard patterns already documented above), and rejecting outright where it didn't. This surfaced a few things worth recording:

- **A Mumbai 1672 map candidate was independently rejected on re-inspection**: "Bombay 1672.jpg" (a 19th-century gazetteer reproduction of Fryer's 1672 map) has "Bombay Towne" and other place labels woven directly into the map's own linework, not in a separable margin — same failure mode as the Goa map, not croppable. No Mumbai item was added this wave.
- **A San José, Costa Rica candidate was rejected on size, not license or spoiler**: the only available scan is an LOC scrapbook page where the inset photo itself, once cropped clear of the handwritten archive captions around it, comes out to only ~700×415 — just under the 480px minimum on height, and no higher-resolution version exists on Commons. Costa Rica has no item from this wave as a result.
- **A Commons file was caught mislabeling its own depicted city**: `FORT_DE_FRANCE,_MARTINIQUE_(1893).jpg` turned out, on inspection, to have "ST. PIERRE — MARTINIQUE" printed as its own caption — a different Martinique city entirely (St. Pierre, destroyed by the 1902 Pelée eruption). Re-attributed and shipped as a St. Pierre item instead of Fort-de-France; Fort-de-France itself remains uncovered rather than being shipped under a guessed or wrong citation.
- **The same mislabeling pattern caught a second time**: a Commons file titled "Cawnpore towards Lucknow.jpg" is, by its own printed title and numbered landmark legend ("Birds Eye View of Lucknow and the Country Towards Cawnpore," River Goomtee, Chuttur Munzil Palace, etc.), actually a view of Lucknow. Not used for Kanpur; Lucknow already has coverage so it wasn't worth the extra crop effort to use it there either.
- **A genuinely illegible foreign-script annotation was treated the same cautious way as the Mosul handwriting precedent**: a 1927 Vientiane postcard had a handwritten Lao-script annotation overlaid on the sky that couldn't be read or ruled out as identifying — cropped out rather than approved on the assumption it was harmless.
- **A real in-scene street sign was treated as a spoiler for the first time**: unlike "Murree Road" in Rawalpindi (a street name that doesn't itself name the city and was allowed to stand), a Penang Road street sign in a Penang street-scene candidate directly spells the depicted place's own name — cropped out rather than waved through as ordinary environmental signage.

### Funnel
- 11 agents, each assigned 8–18 target cities (mostly breadth in thin regions, depth passes in Europe/North America/South/Southeast Asia).
- Fully agent-completed and curator-reverified: 6 East Africa cities (1 fully by the agent, 4 finished centrally, Kigali/Bujumbura/Hargeisa had no viable candidate), 2 Central America (Tegucigalpa approved, Managua/San José/Belize finished or rejected centrally, Panama/Guatemala/El Salvador/San Pedro Sula untouched or dead ends), 1 Caribbean approved directly (Bridgetown) plus 7 more finished centrally (Port of Spain, Willemstad, St. Pierre, Basseterre, St. George's, Castries, Oranjestad), 5 Central Africa (all agent-completed, all gap-closers), 6 Southern Africa (all agent-completed), 3 Southeast Asia agent-approved (Mandalay, Malacca, Dili) plus 4 more finished centrally (Vientiane, Penang, Saigon, Phnom Penh), 1 South Asia agent-completed (Pune, 2 images) plus 11 more finished centrally (Surat, Indore, Amritsar, Srinagar, Kanpur, Patna, Bhopal, Multan, Rawalpindi, Quetta, Chittagong, plus a bonus 12th, Kandy — completing all of the originally-held 12 South Asia cities), 11 Caucasus/Central Asia (all agent-completed: 9 gap-closers plus 2nd images for Samarkand and Bukhara), 17 Western/Central Europe depth images (all agent-completed, zero stalled), 17 Northern/Eastern/Southern Europe depth images (all agent-completed; Athens turned out to be a genuine first image, not depth — it had zero prior coverage despite being assigned as a "second image" city), 1 North America image finished centrally after the agent left it downloaded-but-unchecked (Detroit) plus 1 more sourced fresh and finished centrally (Baltimore) — the rest of the North America depth list (Chicago, Boston, Philadelphia, San Francisco, New Orleans, Toronto, Montreal, Quebec City, Vancouver, Ottawa, Cincinnati, Charleston, Savannah, St. Louis, a 2nd NYC image, a 2nd Mexico City image) is fully researched (license-verified sourceUrl in hand for each) but not yet downloaded/inspected — left as a ready-to-finish backlog rather than pushed through without the mandatory visual check.
- **87 items added this wave**: pool 280 → **367**.
- 33 new gazetteer entries added across the wave (Jaffna carried over from the prior batch is separate; this wave's total gazetteer size reached 363).

### Known gaps for a future batch
- Depth additions for the Southeast Asia cities that already have one image (Bangkok, Jakarta/Batavia, Manila) and for Ho Chi Minh City/Saigon and Phnom Penh's alternate candidates are researched and stalled.
- Fort-de-France (Martinique), Costa Rica, Belize's assigned city was completed but San Pedro Sula was not, Dushanbe, Bishkek, Gaborone, Mbabane, Victoria (Seychelles), Bata (Equatorial Guinea), and Doha (carried over from Wave 2) all remain genuine no-clean-candidate-on-Commons gaps after real search effort, not oversights.
- As always, difficulty ratings are first-pass editorial judgment pending real play-test data, and this wave in particular has had zero human playtesting at its new scale.

---

## Wave 5 (2026-08-24): second "roll toward 1000" push, 367 → 410+

Andrew reviewed a per-city image-count breakdown (Copenhagen led at 3 images, next tier at 2, most cities at 1) and gave explicit guidance: **up to 5 images for a large or historically significant city is fine at 1000-item scale, as long as the pool keeps a broad overall spread of places.** This unblocked depth passes on major capitals that had previously been capped at 1-2 images, alongside continued breadth work in thin regions.

10 agents were launched, several of which further delegated into their own sub-agents (a pattern not used in Wave 3) — this worked but made the agent tree much harder to track; several sub-agents fell into the same "wait for the rate limit / a monitor" pattern as before and needed explicit hard-stop messages, sometimes 2-3 rounds of them, before delivering an honest final report. **Lesson for next time: instruct agents explicitly not to spawn their own sub-agents**, or if they do, expect to have to hunt down and hard-stop the leaves individually — nested delegation adds real coordination overhead without much speed benefit once Wikimedia's shared rate limit becomes the bottleneck anyway (11+ concurrent agents on one IP saturates it regardless of how the work is split).

### Approved this wave (agent-sourced, centrally re-verified): 54 items, pool 367 → **421**

- **Oceania**: Darwin (1873 Booth engraving of the Port Darwin settlement), Dunedin (1874 Burton Brothers elevated view). Honiara confirmed a genuine dead end — the town didn't exist as a settlement before 1945.
- **Major European capitals, depth**: a 3rd Paris image (Degas' *Place de la Concorde*, 1875) and a 3rd London image (an 1839 daguerreotype of Whitehall from Trafalgar Square — one of the earliest surviving London photographs). Rome, Vienna, Berlin, Madrid, Athens, Istanbul, Amsterdam, Prague all stalled — see backlog below.
- **East Asia**: Dalian (Dalny, 1905, day after the Japanese capture of Port Arthur) and Qingdao (a striking ultra-wide 18636px panorama, c.1900) both closed real gaps.
- **Caribbean**: Charlotte Amalie (St. Thomas, 1893) closed a real gap.
- **Central America**: a 2nd San Salvador image (a brickyard genre scene, 1910s).
- **West Africa**: 7 approved — Kumasi, Cotonou, Porto-Novo, Lomé, Banjul, Bissau, Praia all closed real gaps. Conakry was worked hard (~10 candidates) but every postcard-style option had its title baked directly over the photographed sky, not a separable margin — genuinely stalled, not for lack of effort. Nouakchott confirmed a dead end: the city didn't exist before 1929 (a French outpost 1903-08, then abandoned), so no pre-1940 photographic record can exist.
- **North Africa**: 3 approved — Aswan, Tangier, Meknes all closed real gaps (these three had zero prior coverage despite Egypt/Morocco each having other cities covered). A Luxor candidate was rejected: "PYLON & OBELISK. THEBES" is etched directly into the photographic emulsion across the foreground, not a separable margin, and Thebes is the ancient name for the same city.
- **Middle East**: 9 approved — Isfahan, Shiraz, Tabriz, Najaf, Karbala, Nazareth, Bethlehem, Nablus, and a 2nd Basra image, all closing real gaps. Sana'a was attempted again with extra caution per its rejection history: the only institutionally-solid candidate (a 1763 Niebuhr engraving) has its caption in a separable margin, but cropping it drops the image to ~430px height, below the 480px minimum — rejected on size, not spoiler risk. Sana'a remains a genuinely open gap with no clean candidate currently findable on Commons.
- **Southern/East Africa**: 9 approved — Bulawayo, Kimberley, East London, Jinja, Kisumu, Mombasa, Beira, Mahajanga, Nosy Be all closed real gaps (Mombasa in particular turned out to have zero prior coverage, not just needing "depth" as assumed going in). Lusaka was re-attempted per the user's earlier "let it roll" instruction and confirmed as a genuine dead end a second time — the city only became capital in 1935 and has essentially no digitized pre-1940 photographic record. Also confirmed dead ends after real search effort: Livingstone (Zambia), Mbale, Nampula, Toliara. Tanga has one candidate that's undersized (676×441) and no other viable option.
- **Caribbean, depth**: a 2nd Havana image (1870 city-walls skyline, distinct from the existing fort photo) and a 2nd Santo Domingo image (the 1899 cathedral/Columbus Park, distinct from the existing wharf photo).

### Known-good workarounds for Wikimedia rate-limiting

Two independent fixes surfaced this wave, both worth trying first in any future batch before falling into a long wait-and-retry cycle:
1. **`curl -4`** (force IPv4) — one agent (Havana/Santo Domingo) found the 429 was specifically an IPv6-path throttle shared with other concurrent tasks in the sandbox; forcing IPv4 resolved it immediately.
2. **The `thumb.php` endpoint** — `commons.wikimedia.org/w/thumb.php?f=<filename>&width=<n>` is not subject to the same throttle as `upload.wikimedia.org` and still serves full images at the requested width (found by the Middle East agent).

### Large stalled backlog — fully researched, license-verified, ready to finish

Everything below cleared license verification (the real Commons File: page was read, not inferred) but was not downloaded, dimension-checked, or visually spoiler-checked, because 10+ concurrent agents saturated Wikimedia's rate limit for most of this wave's duration. Nothing here should be treated as approved. Each needs: download (try the thumb.php workaround above first), confirm ≥480px both dimensions, and the mandatory personal visual spoiler check — cropping where a caption sits in a separable margin, rejecting outright where it doesn't.

**South America** (13 candidates, exact sourceUrls recorded in agent transcripts this session): Cochabamba, Georgetown (Guyana), Paramaribo, Cayenne (⚠ postcard-era, elevated spoiler risk per this project's own pattern history), Barranquilla, Maracaibo, Concepción (Chile, weakest candidate — a railway bridge, not a cityscape) — all zero-coverage gaps. Plus 2nd images for Buenos Aires, Rio de Janeiro, Lima, Santiago, Bogotá, São Paulo (São Paulo candidate is CC BY-SA, attribution+share-alike required). Gazetteer entries needed: `cochabamba-bo`, `georgetown-gy`, `paramaribo-sr`, `cayenne-gf`, `maracaibo-ve` (Barranquilla and Concepción already have entries).

**Central/Eastern Europe** (16 zero-coverage cities + 2 depth): Poznań, Plzeň, Košice, Graz, Salzburg, Innsbruck, Linz, Nuremberg, Leipzig, Stuttgart, Düsseldorf, Essen, Bremen, Hanover, Rostock, Lviv — plus 2nd images for Frankfurt and Tallinn. ⚠ Innsbruck, Leipzig, Nuremberg, Stuttgart, Salzburg, and Linz in particular flagged as needing careful spoiler checks (old postcards/photochroms in this batch series).

**South/Southeast Asia** (12 candidates): Udaipur, Vadodara, Bhubaneswar, Kochi, Hyderabad (Pakistan/Sindh), Thiruvananthapuram, Jodhpur (⚠ book-scan captions common in this photographer's other work), Mysore — all zero-coverage. Plus a 2nd Colombo image, and 2nd images for Bangkok, Jakarta/Batavia, Manila (⚠ Manila candidate is a souvenir-album photo, these often carry a printed caption line). Faisalabad rejected on size (400×600, width fails). Nagpur, Sylhet, Khulna confirmed dead ends — no pre-1940 photographic record found on Commons for any of the three.

**North Africa, depth** (11 candidates, all already-covered cities getting a 2nd image): Cairo, Alexandria, Tunis, Algiers, Tripoli, Port Said, Rabat, Fez, Marrakesh, Benghazi, plus a replacement Luxor candidate (the first was rejected, see above).

**East Asia, remaining** (6 candidates): Kaifeng, Kaohsiung, Ulaanbaatar (⚠ magazine engraving, needs a careful check that no "Урга" caption is baked into the plate), Pyongyang, Daegu, Nagoya. Luoyang confirmed a dead end — every candidate found was either a modern photo mislabeled as historical or a labeled map (itself a spoiler).

**Major European capitals, depth** (8 candidates, one per city): Rome (Colosseum/Meta Sudans, replacing the existing Piazza Venezia + Forum images), Vienna (Schönbrunn Palace), Berlin (Brandenburg Gate, c.1850 engraving), Madrid (Plaza Mayor), Athens (Hadrian's Arch, a von Eckenbrecher watercolor), Istanbul (Blue Mosque, Abdullah Frères), Amsterdam (Rijksmuseum, 1895 photochrom), Prague (Old Town Square, 1835 engraving — ⚠ its own title includes "...in Prag," needs the caption checked carefully for separability).

**Central America** (3 candidates): San José Costa Rica (National Theatre, LOC glass negative, 6022×4369 — strong candidate, the earlier San José attempt failed only because a different, smaller scrapbook photo was too small once cropped), Panama City (Panama Cathedral, 1904-05 Nordenskiöld expedition photo), Guatemala City (Plaza de Armas, Bain Collection). Tegucigalpa 2nd image also stalled (Catedral de San Miguel, 1904) — San Salvador's 2nd image DID complete, see above.

**Caribbean** (6 candidates): Kingston 2nd image (Duperly & Sons, Jubilee Market — ⚠ other images in this same upload batch are known to carry caption strips), San Juan 2nd image (1927 Army Corps of Engineers harbor panorama — ⚠ survey photography sometimes carries overlaid labels), Fort-de-France (a Josephine-statue photo, 1898 — this time double-check the caption per the St. Pierre mislabeling precedent), Marigot St. Martin, Gustavia St. Barts, Roseau Dominica (⚠ this one is a period engraving with its own printed title, will likely need a crop). George Town Cayman Islands, Road Town BVI, and Cockburn Town Turks & Caicos all confirmed dead ends — no pre-1940 photographic record exists for any of the three on Commons (Road Town's only pre-1940 asset is a nautical chart, not a scene).

This is a genuinely large, high-confidence backlog — every candidate above already cleared the hardest part (finding a plausible, correctly-licensed, on-topic source) and just needs the download-and-look step, which was blocked purely by shared rate-limiting during this session, not by any content problem.

### North America depth backlog completed (same day, continued session)

The 16-city North America depth backlog flagged above was finished immediately after, following the user's "you're doing great" go-ahead to keep rolling. All 16 were downloaded, visually inspected, and (in most cases) cropped by the curator directly — no further agents were launched for this batch.

Two were rejected/adjusted at the crop stage rather than approved as-is:
- **Savannah**'s Bull Street rooftop view had a legible "SAVANNAH STEAM LAUNDRY" sign on a building partway across the frame — not in a separable margin, so a straight crop wasn't available. A solid-color patch over just the sign was tried first (sampling the surrounding brick color) and produced exactly the "obviously redacted" look this project has avoided since the Sana'a blur-patch incident — visibly flat and rectangular against the finely detailed lithographic scene around it. Discarded that approach and instead cropped the entire right ~14% of the frame off, losing that building and the buildings past it but keeping the rest of the panorama (courthouse, square, monument, spires) intact and fully clean.
- St. Louis's "World's Fair, St. Louis, 1904" candidate had been flagged by the sourcing agent as "high spoiler risk" based on a page-text read suggesting the title was integrated into the chromolithograph itself — on direct visual inspection this turned out to be wrong: the title, subtitle, and a table comparing prior world's fairs are all in a clean white margin below the illustration, cleanly croppable. A reminder that a text-extraction summary of a Commons page description is not a substitute for actually looking at the image.

Everything else (Chicago, Boston, Philadelphia, San Francisco, New Orleans, Toronto, Montreal, Quebec City, Vancouver, Ottawa, Cincinnati, Charleston, a second NYC image, a second Mexico City image) passed on the first or second crop attempt — mostly the same recurring pattern of a printed caption in a separate card/mount margin below the photo (Chicago, Boston, Philadelphia, San Francisco, Cincinnati, Ottawa, Charleston) or no baked-in text at all (Toronto, Montreal, Quebec City, Vancouver, NYC, Mexico City).

Pool: 367 → **383**. All 16 items are depth additions to already-covered cities, not new gap-closers — North America's distinct-city count didn't change, only its item-per-city density did.

---

## Wave 5 (2026-08-24): depth-cap policy + backlog finishing pass, 383 → 441+

Andrew reviewed a per-city image-count breakdown (Copenhagen led at 3, next tier at 2, most cities at 1) and set explicit guidance: **up to 5 images for a large or historically significant city is fine at 1000-item scale, as long as the overall pool keeps a broad spread** — recorded in the curator's persistent memory, not just this file, since it should hold across future sessions too. With that green light, this wave combined two things: (1) another 10-agent parallel push, this time explicitly allowed to deepen a handful of major capitals (Paris, London, Rome, Vienna, Berlin, Madrid, Athens, Istanbul, Amsterdam, Prague) alongside the usual breadth targets in thin regions, and (2) a large centralized finishing pass working through the resulting "stalled" backlog directly.

### Two new operational notes worth recording

- **Nested sub-agent delegation.** Several of the 10 agents this wave, when they hit sustained Wikimedia rate-limiting, spawned their own background sub-agents or shell retry-loops rather than working through the problem directly — a new failure mode beyond the earlier "I'll just wait" pattern. These nested children showed up directly in this session's agent list (not hidden behind their parent), so they were reachable and stoppable the same way: an explicit "stop waiting, kill any background process, report your final state now" message. Worth flagging for future batches — the standing instruction to agents should say explicitly not to spawn further sub-agents of their own.
- **The `curl -4` (force IPv4) workaround.** One agent discovered that Wikimedia's rate limiter was hitting this sandbox's IPv6 route specifically — plain `curl -A "<browser-UA>"` kept returning 429/403, but `curl -4 -A "<browser-UA>"` against the exact same URL succeeded immediately, consistently, for the rest of the session. This became the standard direct-download method for the whole centralized finishing pass afterward and cut through what had looked like a saturated shared rate limit. Worth trying first in any future session that hits persistent 429s here.

### Centralized finishing pass — what got done

Using `curl -4`, the curator personally worked through a large fraction of the accumulated "license-verified but never downloaded" backlog left by this wave's 10 agents (and one resumed agent from a prior wave), applying the same visual-inspection-and-crop standard as every batch before it. Two rejections worth recording for the pattern-matching value:

- **Cayenne** (French Guiana): the only candidate found had its caption ("CAYENNE. — Carnaval 1903") printed directly across the lower portion of the photo itself, with people's feet still visible below the text baseline — not a separate margin, and cropping it off would have dropped the image below the 480px minimum. Rejected; Cayenne remains a gap.
- **Innsbruck** (first candidate): despite a period-sounding filename, the photo itself showed 1950s-60s automobiles (VW Beetles, a period Mercedes) — genuinely not historical despite its Commons title implying otherwise, on top of also having "Innsbruck" baked into the pavement. A second, genuinely-1925 candidate was found and used instead (with a delivery truck bearing "Innsbruck" signage cropped out of frame).

As of this note, item count stands at **441** (372 distinct cities, 161 countries, 404 gazetteer entries) with the finishing pass still in progress — South America's entire stalled backlog (13 candidates) was fully cleared, plus the start of the Central/Eastern Europe backlog (Poznań, Plzeň, Košice, Graz, Salzburg, Innsbruck, Nuremberg, Leipzig). One Southern/East Africa agent was still running as of this note (resumed via a fresh worktree-isolated agent after its original transcript wasn't recoverable across a session boundary) — check `content/originals/` and this file's next dated section for whether that landed.

### Known gaps carried forward (as of end of Wave 5)
Everything listed as "stalled" or "not yet researched" in the Wave 3/4 sections above that wasn't explicitly named as cleared in this section is still open: the rest of Central/Eastern Europe (Salzburg done; Linz, Nuremberg done, Leipzig done; still open: Stuttgart, Düsseldorf, Essen, Bremen, Hanover, Rostock, Lviv), all of South/Southeast Asia's stalled batch (Udaipur, Vadodara, Bhubaneswar, Kochi, Hyderabad-PK, Thiruvananthapuram, Jodhpur, Mysore, Bangkok/Jakarta/Manila depth), North Africa's depth batch (11 candidates), East Asia's stalled batch (Kaifeng, Kaohsiung, Ulaanbaatar, Pyongyang, Daegu, Nagoya, Luoyang-no-candidate), the remaining major-capital depth pass (Rome, Vienna, Berlin, Madrid, Athens, Istanbul, Amsterdam, Prague — all fully license-verified with exact sourceUrls recorded in this session's transcript, just not yet downloaded), and Central America/Caribbean depth (Panama City, Guatemala City, Tegucigalpa cathedral, Kingston, San Juan, Fort-de-France, Marigot, Gustavia, Roseau).

---

## Wave 6 (2026-08-25): closing out the major-capital depth pass + finishing Central/Eastern Europe, 451 → 458

Directly continuing Wave 5, no new agents this round — pure centralized finishing work using `curl -4` against the sourceUrls already accumulated in the working session. Two batches completed in full:

**The entire 8-city major-capital depth pass** (Rome, Vienna, Berlin, Madrid, Athens, Istanbul, Amsterdam, Prague) — every one of these now has a 3rd image. Two of the eight (Rome's Colosseum photochrom, Vienna's Schönbrunn photochrom) hit the exact same "Photoglob Zürich P.Z. series bakes its title into the ground at the bottom edge of the frame" pattern already documented in Wave 5's Northern/Eastern Europe notes — cropped the bottom strip off both, consistent with the established handling for that series. Madrid's Plaza Mayor photochrom (also P.Z.) needed two crop passes: the first pass, sized to exclude only the outer grey photo mount, still left the caption visible because it turned out to be baked into the pavement of the photo itself, not just printed on the mount — a reminder that a caption near a photo/mount boundary needs to be checked after cropping, not assumed clean because the crop "should" have caught it.

**The entire remaining 16-city Central/Eastern Europe batch** from Wave 5's research (Poznań, Plzeň, Košice, Graz, Salzburg, Innsbruck, Nuremberg, Leipzig, Stuttgart, Düsseldorf, Essen, Bremen, Hanover, Rostock, Lviv) — all closed. Recurring pattern: several of these (Poznań, Plzeň) had their historical-German-name title ("Posen", "Pilsen") baked directly into the sky or ground of the photo itself rather than a separate margin, same handling as the P.Z. series — crop the strip, re-verify. Stuttgart's caption was genuinely in the stereograph's cream mount margin (not baked into either photo), the cleaner and more common case.

One image, Bremen's Neue Börse photo, had a small tram in the corner with signage too blurred to confidently read one way or the other — treated as "when in doubt, reject the risk, not the whole image": cropped the tram out of frame rather than either forcing the image through unread or discarding an otherwise-clean building photo over an illegible corner detail.

Pool: 451 → **458** (381 distinct cities, 162 countries, 413 gazetteer entries). All of this wave's items are depth additions to already-covered cities except none — Central/Eastern Europe's 16 cities were all genuine first-image gap-closers, continuing from Wave 5.

### Known gaps carried forward (as of end of Wave 6)
North Africa's depth batch (11 candidates: Cairo/Alexandria/Tunis/Algiers/Tripoli/Rabat/Fez/Marrakesh/Port Said/Benghazi 2nd images, Luxor replacement), East Asia's stalled batch (Kaifeng, Kaohsiung, Ulaanbaatar, Pyongyang, Daegu, Nagoya; Luoyang has no candidate), South/Southeast Asia's stalled batch (Udaipur, Vadodara, Bhubaneswar, Kochi, Hyderabad-PK, Thiruvananthapuram, Jodhpur, Mysore, Bangkok/Jakarta/Manila 2nd images), and Central America/Caribbean depth (Panama City, Guatemala City, Tegucigalpa cathedral, Kingston, San Juan, Fort-de-France, Marigot, Gustavia, Roseau) — all still fully license-verified with exact sourceUrls recorded, just not yet downloaded/inspected.

---

## Wave 7 (2026-08-25): the ">double" push begins, mass agent failure, orphan recovery, 458 → 477

Andrew asked whether the pool could realistically more than double (then 458 → 900+) and, on confirmation, said "go for it." This kicked off a much larger parallel push: agents assigned by region to do both depth (2nd/3rd images on already-covered cities) and breadth (genuinely uncovered cities) simultaneously, each instructed to self-integrate directly into `items.json`/`gazetteer.json` rather than reporting research back for manual transcription.

**Mass simultaneous agent failure.** 9 of 11 agents launched for this push died within moments of each other with "Agent stalled: no progress for 600s" — distinct from ordinary rate-limiting. One agent's own surfaced error confirmed the cause: "Your computer went to sleep mid-response." A local machine-sleep event took down most of a wave at once. Attempting to resume via `SendMessage` failed ("No transcript found for agent ID") — these were not resumable, only replaceable.

**Orphan recovery + the fabricated-citation near-miss.** Before relaunching, the curator audited `content/originals/` against `items.json`'s `media.originalPath` references to recover any real work the dead agents had already downloaded but not yet integrated. This recovered a Southern Africa batch (Pretoria, Bloemfontein, Port Elizabeth, Maseru, Port Louis, a 2nd Cape Town image) and a Berbera (Somalia) image, all personally re-verified before integration.

A second orphan batch — 7 India-interior files — went wrong initially: the curator drafted `sourceUrl`s by guessing plausible Commons filenames from the local filenames, rather than verifying them, and only caught this mid-task ("I need to stop — those sourceUrls are fabricated guesses, not verified"). Redone properly: 5 of 7 (Ajmer, Bareilly, Gwalior, Kolhapur, Nashik) were re-verified for real via WebSearch/WebFetch, with corrected exact titles matching the real Commons pages; the other 2 (Aurangabad, Nagpur) had no findable matching real source and were **dropped entirely**, including deleting their local files, rather than shipped with a guessed citation. This directly reinforces the project's standing "never guess a sourceUrl" rule — worth re-reading before any future orphan-recovery pass.

8 fresh replacement agents were then relaunched for the failed regions (with explicit instructions against sub-agent spawning and against guessing sourceUrls from any orphan left by the dead attempt), plus the 9th (Central America/Caribbean depth) once assembled.

Pool: 458 → **477** (Southern Africa + Berbera + India batches). All 9 replacement agents were left running at end of session.

---

## Wave 8 (2026-08-25): session rate-limit hit, final orphan recovery, 477 → 487

All 9 Wave 7 replacement agents failed near-simultaneously again, this time with a clear, different cause: "You've hit your session limit · resets 6:10pm (Europe/Madrid)" — an account-level API session limit, not the machine-sleep issue. By the time this was checked, the reset had already passed.

Before relaunching, the curator: (1) fixed one schema violation an agent had left behind (Kano item used `workType: "engraving"`, not a valid enum value — corrected to `"drawing"` after personally re-viewing the image), and (2) ran the same orphan audit as Wave 7, finding 4 more downloaded-but-unintegrated files (Wuxi, Zhenjiang, Monterrey, Veracruz). Their real Commons `File:` URLs were recovered directly from the dead agents' own JSONL transcripts (grepped for the filename, cross-checked against the actual `curl` commands and WebFetch calls each agent ran) — then independently re-fetched by the curator to re-confirm the license tag fresh, and each image was personally re-viewed for spoiler text, before integration. None of these 4 sourceUrls were guessed from filenames.

Six items had also landed cleanly from the agents before they hit the limit: Denver, Surabaya, Bandung, Kano, Ibadan, Seattle.

Pool: 477 → **487** (487 gazetteer-referenced items, 442 gazetteer entries, 0 orphaned files). Fresh sourcing agents for the still-open regions are being relaunched now that the session limit has cleared.

---

## Wave 9 (2026-08-25/26): relaunching the failed regions, 487 → 530

5 replacement agents were relaunched for the regions hit hardest by the Wave 8 session limit (China interior, Sub-Saharan Africa, Southeast Asia + Pacific, Latin America, US + Canada), plus a fresh Central America + Caribbean depth agent that had never actually gotten to run. Two new failure patterns showed up this wave, both distinct from the earlier ones:

- **Stream-watchdog stalls** ("no progress for 600s (stream watchdog did not recover)") hit 4 of the 5 relaunched agents individually and non-simultaneously — unlike Wave 7's mass sleep event, these were recoverable: `SendMessage` successfully resumed every one of them from its own transcript, with no lost work. Worth noting as a distinct, lower-severity failure mode from the un-resumable mass-sleep case.
- One agent (Sub-Saharan Africa) hit the recurring "I'll wait for the rate limit instead of reporting" pattern again despite explicit instructions against it — fixed the same way as always, an explicit "stop waiting, this is your final turn" message.

**Verification load**: with 5-8 agents self-integrating concurrently into the same two JSON files, dozens of new items landed in rapid, overlapping bursts. Every single one was still personally re-verified (license re-fetched from the live Commons page, image re-viewed for spoiler text) before being trusted — this caught a handful of real issues agents' self-reports didn't flag: a `workType: "engraving"` schema violation (Kano, carried over from Wave 8), four `difficulty` values >5 (China/US items, clamped to 5), and — the most interesting catch — one item (Zhenjiang's Grand Canal junk photo) that an agent's own final report claimed was integrated but whose write had actually been silently lost to a concurrent write race with another agent on the same items.json. Recovered via the standard orphan-file audit (compare `content/originals/` against `media.originalPath` references) and re-integrated with independently-reverified sourcing, not trusted from the agent's claim.

Also fixed: a genuine gazetteer duplicate-city bug found by the Wave 10 Russia agent, predating this session — `saint-petersburg-ru` and `st-petersburg-ru` were two separate gazetteer entries for the same city, each holding one item. Consolidated onto the older id, with the item pointing at the newer duplicate repointed and the alias merged in.

Pool: 487 → **530** (473 gazetteer entries at the end of this wave). Zero orphaned files at every checkpoint.

---

## Wave 10 (2026-08-26): the fully-untouched regions, plus a cleanup pass, 530 → 575

4 more agents: Middle East + Central Asia, Russia + Eastern Europe interior, and Western Europe secondary cities (all three genuinely never reached in earlier waves — every prior attempt at them died to a session-wide rate limit before they could start), plus a consolidated "cleanup" agent working through the small stalled tails left behind by Wave 9's agents (Changsha/Changchun in China, Khartoum/Addis Ababa/Kinshasa/Dar es Salaam/Luanda depth in Sub-Saharan Africa, the Central America/Caribbean depth assignment, and a few remaining Latin America gaps).

Both the Middle East and Russia agents hit sustained Wikimedia 429s and, following the project's now-standard instruction, stopped rather than waiting indefinitely — each left behind a list of fully license-verified-but-not-yet-downloaded candidates for a future pass rather than guessing or forcing a bad download through. The Western Europe agent (30 items) and cleanup agent (11 items) both completed cleanly with no rate-limit trouble, using standard Wikimedia thumbnail widths instead of arbitrary ones to avoid tripping the limiter.

One judgment call worth recording: the cleanup agent sourced an early-1800s Gustavia (Saint-Barthélemy) harbor painting depicting enslaved laborers alongside European colonists — accurate to the Swedish colony's history as a slave society until 1847, but the agent hadn't added a `contentWarning`. Added one on review, consistent with the precedent set by Wave 9's Hohhot occupation item and the ethnographic-dress warnings from the Southeast Asia batch: factual, non-graphic, describes the historical context without alarm.

Sensitive-subject images this wave (Mecca and Medina street/city views) were treated the same as any other city photo — verified on both gates, no special exception — since neither depicts anything beyond an ordinary historical cityscape.

Pool: 530 → **575** (508 gazetteer entries, 0 orphaned files). Known gaps carried forward: the license-verified-but-undownloaded lists from Middle East (9 cities: Beirut/Damascus/Baghdad/Tehran depth, Aleppo, Bursa, Aden, Konya, Izmir) and Russia (23 cities across zero-coverage and depth candidates, full list in that agent's report) are ready for a fast follow-up pass without redoing research. Western Europe's first-image gaps (Naples, Turin, Bologna, Genoa, Palermo, Bari, Seville, Antwerp, Ghent, Rotterdam, The Hague) and remaining depth passes (Milan, Florence, Venice, Copenhagen, Porto, Dublin, Edinburgh) are untouched.

---

## Wave 11 (2026-08-26): closing the Wave 10 follow-up lists + the rest of Western/Southern/Northern Europe, 575 → 622

Three agents, each picking up exactly where Wave 10 left off: a Middle East + Central Asia follow-up working the license-verified candidate list from Wave 10, a Russia + Eastern Europe follow-up doing the same for its 23-city list, and a fresh Southern + Northern Europe agent covering the Western Europe first-image gaps (Naples, Turin, Bologna, Genoa, Palermo, Seville, Antwerp, Ghent, Rotterdam, The Hague) plus a depth pass (Milan, Florence, Venice, Copenhagen, Porto, Dublin, Edinburgh).

**A genuinely new failure mode to file alongside the others**: two of the Middle East candidates (Konya, Baghdad) passed the license gate cleanly but failed the minimum-dimension gate — both topped out at native resolutions around 650-750px wide, already below the 480px *height* floor before any downscaling, with no larger derivative on Commons. The agent correctly left them undone rather than force a substitute through or silently drop the requirement — this is the same "hard no-exceptions gate" the project has always applied, just the first time it bit on *license-clean* candidates rather than spoiler-tainted ones.

**Verification highlights**: with 47 items landing across three concurrently-writing agents, the curator's personal re-verification caught two things worth recording. First, an Odesa item (`commons-odesa-dom-russova-1912`) initially looked like a content mismatch on inspection — its title says "Russov House" but the actual image shows a military parade formation in front of a grand building, not obviously a "house." Cross-checked directly against the Commons page's own description rather than assuming an error: it's a genuine 1912 postcard of the Russov House with a Bulgarian military unit's ceremonial formation in front — a real, if unusual, combination of subject matter, not a mismatch. Worth remembering: an image that doesn't match its filename's apparent subject at a glance isn't automatically wrong — check the source description before rejecting or flagging it. Second, a Kraków lithograph came in at exactly 490px height — 10px above the hard floor — confirmed by direct pixel measurement rather than trusting the agent's report of "close to the limit."

No contentWarnings were needed this wave despite several ceremonial/ethnographic-adjacent images (Edinburgh Highland regiment review, Odesa's Bulgarian formation, Mecca/Medina cityscapes) — all are peaceful ceremony or ordinary cityscape, consistent with the project's existing precedent of reserving warnings for occupation, slavery, or genuine ethnographic-dress content, not for uniforms or crowds alone.

Pool: 575 → **622** (519 gazetteer entries, 0 orphaned files). Known gaps carried forward: Bari (no pre-1940 Commons candidate found after real effort, no gazetteer entry either — matches the project's "genuine dead end" precedent like Guiyang/Luoyang), Chișinău (same), Konya and Baghdad (license-clean but undersized, no larger derivative exists), and Central Asia's untouched Priority 2 list from Wave 10 (Amman, Basra, Muscat, Sana'a, Riyadh, Jeddah, Isfahan, Shiraz, Tabriz, Yerevan, Tbilisi, Baku, Ashgabat, Bukhara, Samarkand, Tashkent, Almaty — all already have ≥1 item, so this is optional depth, not a gap).

---

## Wave 12 (2026-08-26): first push into fresh territory — South Asia, East Asia, Central Asia depth, Scandinavia, 622 → 655

Three agents covering ground genuinely untouched so far this session: South Asia interior (secondary Indian cities plus Pakistan/Bangladesh/Nepal/Sri Lanka/Bhutan), Japan/Korea/Taiwan, and a combined Central Asia depth + Scandinavia/Baltic breadth assignment.

**The Sana'a-2009 catch.** The Central Asia/Scandinavia agent sourced a photo for Sana'a (Yemen), correctly passing the license and spoiler gates — but the depicted date was 2009. This is the exact same mistake the project rejected once already: Wave 1's curation notes record "Lusaka's only candidate is a 2008 photograph... a modern photo still fails the game's basic 'historical' premise regardless of a clean license and spoiler check, so it was dropped, matching the earlier Sana'a-2014 precedent from Wave 1" — meaning this exact city has now produced a rejected modern-photo candidate twice, in two different sessions, for the same underlying reason (Yemen has very little freely-licensed pre-1940 photography, so agents searching for *anything* usable keep surfacing 21st-century tourism photos as the "best" result). Removed the item, its gazetteer entry, and the file. Worth flagging prominently for any future Sana'a attempt: this city is very likely a genuine dead end, not just an unlucky miss — the two-gate process only checks license and spoiler-text, not date-plausibility, so this is the one place an agent's own good-faith "no candidate found" would actually be the correct, honest answer, and a future agent should be told this directly rather than re-discovering it a third time.

**A content-mismatch scare that turned out fine.** One Central Asia depth item's Commons title claimed "Alexander Nevsky Cathedral, Baku" but the actual photograph shows a plain street with only a distant, unclear domed structure — not a recognizable cathedral facade. Rather than reject or silently accept the mismatched title, the sourcing agent retitled and re-contextualized the item to describe only what's actually visible ("a quiet unpaved street... a domed tower in the distance"), leaving the original Commons title in the sourceUrl/creditText for traceability. This is the right way to handle a source-title/image mismatch — good practice worth pointing to as a model for future cases, alongside last wave's Odesa "Russov House" example (where the opposite call was right: the mismatch there was only apparent, and the real Commons description confirmed the title was accurate).

**Genuinely new gates got exercised, not just old ones.** The Japan/Korea/Taiwan agent hit several license-clean candidates that were undersized at native resolution with no larger derivative (Sendai, Utsunomiya, Hamamatsu, an early Kagoshima candidate) — same "hard no-exceptions" pattern as Wave 11's Konya/Baghdad, now showing up across a third region, confirming this is a real and recurring constraint on 19th-century sourcing generally, not a one-off. The same agent also correctly declined to force a Hiroshima candidate given the total absence of usable non-bomb-related pre-1945 material, rather than either skipping the difficult judgment call or picking something inappropriate.

Pool: 622 → **655** (537 gazetteer entries, 0 orphaned files, after the Sana'a removal). Known gaps carried forward: 9 Japan/Taiwan/Korea candidates that are license-verified and spoiler-checked-pending (list in that agent's report, blocked by rate limiting, not yet integrated), Tbilisi (a strong 1891 candidate exists but is undersized with no fix), 7 Middle East/Central Asia cities with no viable candidate found after real search (Tabriz, Tashkent, Amman, Muscat, Riyadh, Jeddah, Ashgabat), and a long list of South Asian interior towns confirmed as genuine photographic dead ends on Commons (recorded in full in that agent's report) — Bhutan and much of interior Nepal/Bangladesh in particular appear to have essentially no free-licensed pre-1940 photographic record.

---

## Wave 13 (2026-08-27): three fresh regions at once — Oceania, Sub-Saharan/North Africa depth, East Asia closeout, 655 → 725

First attempt at this wave hit the same session-wide API rate limit documented in Wave 7/8 (all 3 agents failed immediately with "session limit resets 10:40am"); relaunched fresh once the user confirmed the limit had cleared, rather than waiting out the full reset window. All 3 relaunched agents completed successfully this time.

**Oceania + Pacific + Australia/NZ** (31 items): closed real first-image gaps across Australia (Canberra, Geelong, Toowoomba, Ballarat, Bendigo, Broken Hill, Launceston, Wollongong, Townsville, Cairns) and NZ (Nelson, Napier, Invercargill, Palmerston North, Hamilton, Rotorua), plus Koror and Hagåtña for the Pacific, plus a round of depth passes on the major state/national capitals. One real judgment call worth recording: a Port Moresby candidate (Hanuabada village children, 1914) was found and license-verified but **skipped outright** because it showed minimally-clothed children up close — the agent judged this needed more than the standard factual contentWarning treatment used elsewhere in the dataset and left the city at its existing 1 item rather than force it through. This is the right call and the right threshold: the project's ethnographic-content exception (Wave 12's Denpasar/Luang Prabang/Brunei precedent) is for adult subjects in documentary context, not close-up photography of unclothed children — this line should hold for any future Pacific/Melanesia sourcing.

**Sub-Saharan Africa breadth + North Africa depth** (22 items): mostly clean depth additions and two genuine new-country entries (São Tomé, Pointe-Noire). No modern-photo mistakes this time — the agent was explicitly warned about the Sana'a precedent from Wave 12 and correctly rejected a 2008 Moroni candidate on exactly those grounds.

**China/Mongolia + Japan/Taiwan follow-up** (19 items): fully closed the 9-city stalled list from Wave 12 (Himeji, Hakodate, Kumamoto, Nikko, Kagoshima, Shimonoseki, Tainan, Chiayi, Kaesong) plus 10 more China/Mongolia cities. Good judgment on two rejections: a Fushun coal-mine photo had its caption burned directly into the mining-pit scene (hard reject, consistent with the standing rule), and a Baoding "Chinese court" postcard was dropped even though it passed every mechanical gate — it turned out to be a generic staged studio photo with zero Baoding-identifying content, i.e. technically clean but not an actual depiction of the place. Worth naming as its own category alongside the Odesa/Baku precedents from Waves 11-12: **passing the gates isn't the same as being a genuine photo of the assigned city** — verify the image actually shows what it claims to, not just that its paperwork is clean.

**Verification note**: one item (Hagåtña, Guam) triggered repeated 404s from WebFetch on its own sourceUrl despite the file genuinely existing — the URL's diacritic-heavy filename (Hagåtña) was being mis-encoded somewhere in the fetch pipeline. Resolved by querying the MediaWiki API directly (`action=query&list=search` to find the real pageid, then `action=query&prop=imageinfo&iiprop=extmetadata` for the license) rather than trusting the 404 as evidence the file or license was wrong. Worth remembering for any future item with non-ASCII characters in its filename: a WebFetch 404 on a Commons URL is not proof the source is bad — try the API before concluding that.

Pool: 655 → **725** (569 gazetteer entries, 0 orphaned files). Known gaps carried forward: Bunbury, Whanganui, Nouméa, Funafuti, Majuro (all confirmed no-pre-1940-candidate after real search), Port Moresby depth (skipped for content-sensitivity reasons, not lack of trying), and the usual long tail of individual China/Mongolia cities with no surviving pre-1945 photographic record on Commons.

---

## Wave 14 (2026-08-27): North America + South America + Europe, hit hard by rate-limiting, 725 → 758

Three agents launched simultaneously (US/Canada/Mexico, South America remaining depth/breadth, Europe remaining gaps). All three hit a persistent Wikimedia `upload.wikimedia.org` 429 rate limit roughly 20 minutes in — worse than prior waves, this one didn't clear within any agent's session. The Europe agent handled it well: pivoted to pure license/metadata research via the Commons API (which stayed responsive throughout) and delivered 25 fully-vetted, ready-to-download candidates instead of stalling. The US/Canada/Mexico agent's *own process* separately hit a session-length API limit mid-task (distinct from the Wikimedia rate limit) and had to be relaunched fresh once that cleared.

**A real duplicate-item bug caught by the orphan/dedup audit.** After this wave's South America items landed, the routine `items.length` vs. `content/originals/` file-count check came up 759 items against 758 files with 0 "orphans" — impossible unless two items shared one file. Investigation found exactly that: `commons-barranquilla-camellon-1903` (added Wave 5, 2026-08-24) and `commons-barranquilla-camellon-abello-1903` (added this wave by an agent that didn't check existing coverage thoroughly enough) were the *same* Commons photo, same sourceUrl, added three days apart under two different ids. Removed the newer duplicate. This is a new check worth running after every wave from now on: `items.length !== new Set(items.map(i => i.media.originalPath)).size` catches same-file duplicates that an orphan-only audit (files vs. items) cannot, since both duplicate item entries correctly point to an existing file — nothing is "orphaned," the file just has two owners. Also reinforces why every wave-14+ agent prompt now explicitly instructs checking whether the exact same Commons sourceUrl is already present under a different id before integrating.

**South America** (13 items): closed real gaps (Salta, Antofagasta, San Miguel de Tucumán, Bucaramanga, Potosí, Corrientes as first images) plus solid depth passes (Rosario, Córdoba, Cusco, Arequipa, Barranquilla, Montevideo, Georgetown). Good rejections: a Guayaquil depth candidate's own Commons description said "c. 1940s" despite a misleading "años 20" filename — correctly rejected on the actual date, not the filename's claim; several Argentina/Peru postcard-series candidates (La Plata, Mendoza, Trujillo) had captions burned directly into the sky, not a separable margin — all correctly rejected rather than cropped.

**Europe** (1 item — Trieste — plus the 25-candidate research queue described above): third Bari attempt confirmed it as a genuine dead end (matches the Guiyang/Luoyang/Chișinău precedent — safe to stop trying).

Pool: 725 → **758** (595 gazetteer entries, 0 orphaned files, after the Barranquilla dedup fix). Two follow-up agents relaunched immediately: one to redo the failed US/Canada/Mexico assignment fresh, one to finish the Europe queue's 25 pre-vetted candidates (re-verifying license/date/depiction from scratch per the "trust but verify" rule — the queue is a research shortcut, not a pre-approved list).

---

## Wave 15 (2026-08-27): Europe stalled-queue finished, first pass over 800, 758 → ~812+

The Europe follow-up agent's connection dropped mid-task (a distinct failure mode from rate-limiting or session limits — an actual stream disconnect); resumed cleanly via the same in-place-resume pattern used for prior stalls, no work lost. It closed all 29 queued candidates plus caught its own pre-disconnect mistake on Groningen (had assumed a caption was already cropped out when it wasn't — fixed before integrating) and a genuine city misidentification on Pristina (the original Kosovo candidates actually depicted Prizren, not Pristina — caught and replaced with a verified Pristina source before integrating, not after).

**A real hard-gate violation caught by the build script itself, not by the curator.** `npm run build:content` started flagging undersized images directly (`"commons-siena-piazza-del-campo-1870" is 380x637, below the 480px minimum`) — the agent's crop to isolate one panel of a stereo card had cut it down too far. Rather than drop the item, re-downloaded the full 4410×2194 original via the MediaWiki API, re-cropped a single stereo panel more conservatively (1150×1900, comfortably clear of both text columns), and swapped it in. Worth noting for future undersized-crop cases: the fix is usually available by going back to the full-resolution source and cropping less aggressively, not just discarding the item.

**Marseille's WebFetch verification 404'd repeatedly** on a URL that turned out to have the wrong extension recorded in items.json (`.jpg` vs the file's real `.tif`) — resolved via the MediaWiki API search-by-title method now standard for this failure mode (see Wave 13's Hagåtña note), which returned the real title and confirmed the license directly.

Balkans coverage is now genuinely non-zero for the first time this project: Thessaloniki, Skopje, Podgorica, and Pristina all got their first images this wave.

**Multiple other Claude sessions are working this same repo concurrently** (confirmed via `ListAgents` showing several peer sessions, not just this session's own launched subagents) — this explains items appearing in `items.json` that weren't sourced by anything this session launched (e.g. a `commons-saskatoon-canoeing-river` item appeared mid-wave from an untracked source). This makes the re-read-fresh-before-every-write discipline and the same-file-duplicate check (introduced in Wave 14) even more important going forward, since duplicate/collision risk is now cross-session, not just cross-agent-within-session.

Pool: 758 → **812+** (growing further from concurrent activity) — crossing 800 for the first time and closing in on the user's ">double the pool" (900+) target.

---

## Wave 17 (2026-08-28): the final push, 928 → 1000 exactly

Three agents launched at once (Middle East + Central Asia depth, Africa remaining depth/breadth, Eastern Europe + Baltic + Scandinavia depth) — all three hit the same session-level rate limit within moments of each other and had to be relaunched fresh once it cleared (resets are per-account, not per-agent, so simultaneous launches share the same clock). Each relaunch checked for partial progress first; nothing was lost, everything the first attempt had integrated before dying was found and kept.

**A genuine hard-gate violation caught by the build script again, this time on Yaroslavl.** A depth-image crop (1024×625 postcard, cropped to 1024×460 to remove a red Cyrillic caption) failed the 480px minimum. Unlike Siena in Wave 15, this one couldn't be fixed the same way: re-downloading the full-resolution original and testing a crop at exactly 480px still left the top of the caption text legible — the caption band was simply too tall relative to the source image to clear both constraints at once. Removed the item (Yaroslavl kept its original Wave 12 item, so the city wasn't left uncovered). Worth recording as the counterpart to the Siena fix: sometimes going back to the full-resolution source *does* rescue an over-cropped image, and sometimes the source itself doesn't have enough clean vertical room — check before assuming every undersized crop is salvageable.

**Three more orphaned files recovered via visual matching, not guessing** — Podgorica, Pristina, and Thessaloniki depth images were downloaded by the Eastern Europe agent but never integrated before it hit the rate limit. Same recovery method as Wave 13's Hagåtña: searched Commons by content description, downloaded candidates, and visually matched them against the orphaned files pixel-for-pixel rather than assuming any single search result was correct. The Podgorica match took four attempts (a batch of four "Views of Podgorica, February 1916" German military-archive photos with identical titles differing only by catalog ID) before the fortress-and-riverside candidate matched.

**A new spoiler category confirmed a second time**: the Middle East agent flagged a Bursa candidate whose caption read "BROUSSE" (the historical French name for Bursa) baked directly into the photo margin — recognized and cropped correctly as a direct city-name spoiler, same category as Wave 16's Saigon Palace catch (a name that spells the depicted place, just under a historical/foreign name rather than a business name). This is now a well-established pattern: check historical/foreign-language names for the same city, not just its current name, when scanning for spoilers.

**A schema violation slipped through in the very last batch**: a Luanda engraving was tagged `workType: "print"`, which isn't in the three-value enum (`photo`/`painting`/`drawing`). Caught by personal review of the final Africa batch, not by the build script this time (the build script only checks image dimensions and file presence, not this particular field against the schema — `ci-validate-content.js` catches it, `build-content.js` doesn't). Fixed to `"drawing"` (it's a 1647 copperplate engraving). Worth remembering: schema-shape violations and dimension violations are caught by different tools, so both need to run, not just one.

**Regional coverage completed this wave**: Central Asia (Bishkek joins Tashkent/Samarkand/Almaty/etc. with its first-ever item — a 1924 Lenin-mourning rally, the only viable pre-1940 photographic record for a city with almost no early photography), several more North/West/Southern African depth passes (Johannesburg, Pretoria, Bloemfontein, Cape Town, Durban, Bamako, Djibouti, Monrovia, Conakry, Harare, Abidjan, Luanda — Luanda's item is a 1647 Dutch engraving, the oldest depicted date in the entire dataset), and closing depth passes across Russia, the Balkans, and Scandinavia.

Pool: 928 → **exactly 1000** (706 gazetteer entries, 0 schema errors, 0 orphaned files, 0 duplicates by path or sourceUrl). This is the user's revised target ("go for 1000 :)"), reached and fully verified — every single one of these 1000 items has been through the two-gate process (license verified against the live Commons page, personally visually inspected for spoiler text) by the curator directly, not just by a sourcing agent's self-report.

**Wave 14's US/Canada/Mexico retry landed separately and completed after this note was first written** (44 items: 21 US, 13 Canada, 10 Mexico — Albuquerque through Mérida-depth, full list in that agent's report). Personal re-verification caught a real, significant miss: **the Hamilton, Ontario item had the word "HAMILTON" clearly etched into the photograph's negative itself**, angled across the lower-left foreground — the sourcing agent's own spoiler check missed it entirely, and it only surfaced when the curator zoomed into a faint mark that looked ambiguous at normal viewing size. Removed the item, its `hamilton-on-ca` gazetteer entry (unique to that item), and the file. **This is the most important reminder from this entire session**: a "clean" agent self-report is not sufficient, full-resolution zoom-in inspection on any ambiguous mark is mandatory, and this applies even to agents that clearly understand and correctly apply the spoiler-check rule elsewhere in the same batch (the same agent correctly rejected two Tulsa candidates and a Mazatlán carnival card for baked-in text) — a single miss can still slip through a large batch, so every image gets the same scrutiny regardless of the agent's track record earlier in its own report.

The other 43 items all passed cleanly, including some good agent judgment calls worth noting: a Pierre, SD candidate was rejected because its depicted subject turned out to actually be Rapid City despite being mailed from Pierre (a postcard-mailing-location ≠ depicted-location trap); several Tulsa candidates had the city name baked directly into the sky/rooftop of the photo itself. SMU's DeGolyer Library Flickr Commons collection (C.B. Waite, Albert L. Beach photography) proved to be a strong, well-licensed source for secondary Mexican cities and is worth remembering for future Latin America waves.

Pool: **830** (659 gazetteer entries, 0 orphaned files, 0 same-file duplicates) after the Hamilton removal — comfortably past 800 and within reach of the user's original ">double the pool" (900+) target from the ~458-item baseline at the start of this growth push.

---

## Wave 16 (2026-08-27/28): pushing past 830 toward a revised 1000-item target

The user confirmed 830 was solid (asked specifically "do you have 830 unique images?" — answered with a two-level uniqueness check: 0 items share a local file path, 0 items share the same Commons sourceUrl), then explicitly raised the target: **"go for 1000 :)"**. Three fresh agents launched: major-capitals depth + Germany/UK/Ireland, South + Southeast Asia depth/breadth, Latin America + Caribbean + Brazil depth/breadth. From this point forward, every orphan/dedup check runs both the file-path AND the sourceUrl uniqueness test — the file-path-only check would have missed the Barranquilla duplicate from Wave 14 if the two entries had used different local filenames.

**Latin America + Caribbean + Brazil** (14 items): clean pass, no rejections needed post-verification. The sourcing agent itself correctly rejected several strong-looking candidates before they ever reached the curator — Guadalajara, Tijuana, and Puebla all had captions fused into the photographic emulsion (not separable margins); Natal was rejected because the depicted train station has "NATAL" as part of its actual physical signage, not croppable without losing the building. Good discipline.

**South + Southeast Asia** (25 items reported, 24 approved after verification): one real catch. The Ho Chi Minh City (Saigon) depth item showed "SAIGON·PALACE" in large legible letters across a hotel facade — the sourcing agent's own curation notes explicitly reasoned this was fine "per landmark-naming convention," the same reasoning that correctly allows generic labels like "City Hall" or "Government House." That reasoning doesn't hold here: those labels are generic building-function words, while "Saigon Palace" is a specific business name that happens to spell out the depicted city's own period name in large text — a player could read the exact answer directly off the building. Rejected and removed (the city's gazetteer entry survives via its other, already-existing depth image, so no orphaned gazetteer entry). **This is now a distinct category from the established "landmark/building names are fine" rule**: a landmark or generic building-function name is fine; a proper-noun business name that itself contains the depicted city's name is not, no matter how it's phrased in an agent's own reasoning. Every future agent prompt now states this distinction explicitly.

A second, lower-stakes catch: the Kuala Lumpur item's Commons file is literally titled "Mosque at Kuala Lumpur," but the image clearly shows a large colonial administrative building with a central clock tower — visually inconsistent with a mosque. Rather than reject on the apparent mismatch, re-verified via WebFetch and confirmed this is a known old Commons cataloguing error: the building is genuinely the Sultan Abdul Samad Building under construction, and the file's own extended description acknowledges the "mosque" label in the title is wrong. The location (Kuala Lumpur) was never in question — only the building's identity — so this passed. Same category of judgment call as the Baku/Odesa title-mismatches from Waves 11-12: verify against the source's own fuller description before assuming an error, but don't let that override a genuine, confirmed spoiler like Saigon Palace.

Pool: 830 → **871** (664 gazetteer entries, 0 orphaned files, 0 duplicates by path or sourceUrl) after the Saigon Palace removal. The major-capitals + Germany/UK/Ireland agent failed early on a session-level rate limit (distinct from Wikimedia's own limit) that reset at 8:40pm Europe/Madrid — relaunched fresh once past that time, checking for partial progress first.

**The relaunched major-capitals + Germany/UK/Ireland agent completed with 57 items** — the single largest batch of this entire session. 32 breadth items (13 new German cities: Karlsruhe, Mannheim, Wiesbaden, Mainz, Freiburg, Regensburg, Augsburg, Würzburg, Kiel, Magdeburg, Erfurt, Potsdam, Aachen; 19 new UK/Ireland cities: Birmingham, Liverpool, Leeds, Sheffield, Bristol, Newcastle upon Tyne, Nottingham, Leicester, Coventry, Aberdeen, Inverness, Dundee, Bath, York, Oxford, Cambridge, Limerick, Galway, Waterford) plus 25 depth items (16 major-capital 3rd/4th/5th images, 5 German depth, 4 UK/Ireland depth). All 57 personally verified — the largest single-batch verification pass this session, and the first time a full 57-item batch came back with zero rejections needed after the standard license+spoiler+date+city-match check. Nearly all images were from the Library of Congress Photochrom Print Collection or National Library of Ireland's Lawrence Collection — reliably clean, well-documented public domain sources with generic business signage (hotel names, shop names) rather than city-naming captions.

Pool: 871 → **928** (694 gazetteer entries, 0 orphaned files, 0 duplicates by path or sourceUrl) — 72 items short of the user's 1000 target, with strong sourcing momentum (this single batch alone was larger than most entire early-session waves).

---

## Post-1000 game verification (2026-08-28): a real bug the wave-level process missed

The user asked, after seeing the milestone analysis dashboard: "is the game working with all of them?" Ran a full verification pass rather than a spot-check: `npm run build:content` + `npm run validate:content` clean at 1000/1000; the existing Playwright e2e suite (`e2e/complete-session.spec.js`, `e2e/timeout-and-recoverable-failure.spec.js`) passed all 3 tests (full 10-round session, round timeout, image-load-failure recovery) with zero console errors; then a full-pool integrity sweep with `sharp` reading every one of the 2,719 published asset files (three srcset widths × ~907 items that needed all three, fewer for narrower originals) across all 1000 manifest items — every file exists, decodes, and matches its declared dimensions, and every item's `location.placeId` resolves in the gazetteer. No missing files, no corrupt files, no orphaned gazetteer references.

**One real bug found**: `commons-krakow-panorama-podgorze`'s downloaded original (`krakow-panorama-from-podgorze-1860.jpg`) was byte-identical (SHA-256 match) to `commons-krakow-panorama-lithograph-1860`'s original, despite different filenames, different titles, and different Commons `sourceUrl`s — invisible to every prior dedup check this session, which only ever compared sourceUrl/path strings, never file content. A content-hash sweep of all 1000 originals confirmed this was the *only* duplicate in the pool. Investigated which of the two was real: `File:Widok_Krakowa,_1860_Litografia_z_tintą.jpg` (the lithograph item) resolved correctly via WebFetch — a genuine 1860 Jędrzej Brydak lithograph. `File:Krakow_panorama_Podgorze_1860.jpg` (the "podgorze" item's cited URL) 404'd, and a MediaWiki API title search confirmed no such file has ever existed on Commons. The "podgorze" item's own curation note claimed it had been "centrally re-verified" during Wave 2 — it hadn't been, or the re-verification itself was faulty. This is a fabricated/unverifiable citation exactly like the Wave-7 India near-miss, except this one shipped all the way to the 1000-item milestone undetected. Removed the item and its original file; Krakow keeps coverage via the (real) lithograph item, so nothing orphaned in the gazetteer. Rebuilt clean at **999/999**, 706 gazetteer entries.

**Lesson**: sourceUrl/path-string dedup checks cannot catch a duplicate that was downloaded under a different filename with a different (even fabricated) citation — only a content hash catches that. Worth running a full SHA-256 sweep of `content/originals/` periodically, not just after visible symptoms.

**Separate, unfixed finding — not a bug, a display gap**: 21 items (2.1% of the pool) are ultra-wide panorama crops whose published 1600w asset has a height under 480px — down to 94px for the worst case (`commons-toronto-panorama-rossin-house`, 1600×94, a ~17:1 aspect ratio strip). These correctly cleared the *original-file* 480px-minimum gate (the rule applies to the source image, not each generated responsive variant), but the current CSS (`#round-image { width: 100%; height: auto }`, no max-aspect-ratio or letterboxing) renders them as a paper-thin sliver at typical game-container widths — confirmed by viewing the Toronto asset directly. Flagged for the user to decide on a fix (CSS aspect-ratio cap/letterbox vs. re-cropping the 21 originals to a less extreme ratio) rather than choosing unilaterally, since it's a display-design call, not a correctness bug.

Pool: 1000 → **999** pending a replacement item to restore the milestone count.

### Known gaps carried forward (as of end of Wave 8)
Everything listed at the end of Wave 6 that isn't confirmed done above is still open, plus whatever the 9 Wave-7/8 agents hadn't reached yet in their assigned regions (China interior, Sub-Saharan Africa, Southeast Asia interior + Pacific, Latin America, US/Canada secondary cities, Middle East + Central Asia, Russia + Eastern Europe interior, Western Europe secondary cities, Central America/Caribbean depth) — each agent typically only completed 1-2 cities before hitting the session limit, so these regions are essentially still at their Wave 6 starting point.
