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

- 41 records from the original Firestore export remain uncurated.
- The `\Copenhagen` typo record should either be fixed (strip the leading backslash) and curated, or dropped as a near-duplicate of the two other correctly-named Copenhagen entries — not yet decided.
- Difficulty ratings (`classification.difficulty`) are a first-pass editorial judgment, not calibrated against any actual play session — plan.md §9 already expects these to move once real play-test data exists.
