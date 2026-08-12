// The non-image portion of the source-item -> published-manifest-item
// transformation, factored out so build-content.js and
// ci-validate-content.js can't silently drift apart. build-content.js
// adds the `image` field itself (which needs real media processing);
// everything here is a pure, deterministic copy from the curator source
// and needs no image bytes at all — which is exactly why
// ci-validate-content.js can use it to check that public/content/manifest.json
// actually matches content/source/items.json, without CI needing the
// real originals.
//
// item.contentWarning is intentionally NOT copied here: per plan.md §10
// it's curator-only editorial metadata (a content-selection judgment
// call, e.g. flagging wartime imagery), not a player-facing field — v1
// has no content-filtering or warning-display UI to show it in.
export function toManifestItemNonImageFields(item) {
  return {
    id: item.id,
    workType: item.workType,
    location: item.location,
    depictedDate: item.depictedDate,
    creationDate: item.creationDate,
    classification: {
      region: item.classification.region,
      difficulty: item.classification.difficulty,
      tags: item.classification.tags,
    },
    clues: item.clues,
    title: item.title,
    artistOrCreator: item.artistOrCreator,
    context: item.context,
    attribution: item.attribution,
  };
}
