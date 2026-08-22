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
