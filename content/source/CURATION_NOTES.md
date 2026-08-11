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
- **13** of those 41 were rejected after visual inspection for a caption or title baked directly into the image, printed in the margin or overlaid on the scene — the exact pattern later confirmed in Goa/Bogotá:
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
- Of the remaining **27**, **10** turned out to be below the 480px minimum dimension on at least one side once actually decoded (`content/schemas` / `scripts/lib/media.js` enforce this at build time, not at curation time, so this was only caught when `npm run build:content` refused them): `kathmandu-market-1920.jpg`, `dhaka-city-1861.png`, `karachi-04c-1930.jpg`, `karachi-st-joseph-1910.jpg`, `antananarivo-tombs-1885.jpg`, `karachi-old-1830.jpg`, `singapore-victoria-dock-1890.jpg`, `varanasi-river-1883.jpg`, `colombo-independence-1947.jpg`, `hong-kong-city-of-victoria-1865.jpg`. A further item, `lucknow-palace-gates-1801.jpg`, failed the same check (451×300). These are genuinely low-resolution scans on Commons — no higher-resolution version exists — so they were dropped rather than upscaled.
- **17 items were approved**, bringing the total curated pool from 20 to **37**.

## New gazetteer entries

Four new cities were added to `gazetteer.json` (173 → 177 entries) to support this batch: Kabul (Afghanistan — the batch's first Central Asian entry and first Afghan entry), Pondicherry (India), and Santiago, Chile was already present as `santiago-cl` (distinct from the pre-existing `santiago-de-cuba-cu`) so no addition was needed there. Lucknow and Antananarivo were also added but ended up with no approved items in this batch (Lucknow's only candidate was too small; Antananarivo's only candidate was too small) — both are kept as valid decoy/future-use gazetteer entries rather than removed.

## Content warnings

`copenhagen-shellhuset-1945.jpg` carries a `contentWarning` (wartime destruction — a building on fire following the RAF's Operation Carthage bombing raid, 21 March 1945; no visible casualties), following the same pattern plan.md §9 already expects for sensitive content.

## Attribution note

`mexico-city-paseo-viga-1642.jpg` is the batch's one CC BY-SA 4.0 item (donated to Commons by Museo Soumaya) rather than public domain — carries an attribution + share-alike obligation, encoded in `attribution.creditText`.

## Known gaps for a future batch

- 25 records from the original 62-record Firestore export remain fully unprocessed by this pipeline: the 5 rejected for baked-in spoiler text that might be salvageable by cropping (not attempted here — no cropping step exists in the current pipeline), the 1 held for graphic content, the 1 held for incomplete license, and others. A future batch could also look beyond the original Firestore export entirely for genuinely new sourcing, per the M5 play-test follow-up list.
- Difficulty ratings for this batch are, as with M2, first-pass editorial judgment pending real play-test data.
