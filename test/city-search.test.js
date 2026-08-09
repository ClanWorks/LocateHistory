import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { searchGazetteer } from "../public/js/city-search.js";

const gazetteer = [
  { id: "prague-cz", displayName: "Prague", aliases: ["Praha"], historicalNames: ["Prag"] },
  { id: "bogota-co", displayName: "Bogotá", aliases: ["Bogota"], historicalNames: ["Santa Fe de Bogotá"] },
  { id: "saint-petersburg-ru", displayName: "Saint Petersburg", aliases: ["St Petersburg"], historicalNames: ["Leningrad", "Petrograd"] },
  { id: "prahova-something", displayName: "Prahova", aliases: [], historicalNames: [] },
];

describe("searchGazetteer", () => {
  test("empty query returns no results", () => {
    assert.deepEqual(searchGazetteer(gazetteer, ""), []);
    assert.deepEqual(searchGazetteer(gazetteer, "   "), []);
  });

  test("exact match ranks above a prefix match on a different entry", () => {
    const results = searchGazetteer(gazetteer, "prague");
    assert.equal(results[0].id, "prague-cz");
  });

  test("prefix match beats substring match", () => {
    const bangkokAndDurban = [
      { id: "bangkok-th", displayName: "Bangkok", aliases: [], historicalNames: [] },
      { id: "durban-za", displayName: "Durban", aliases: [], historicalNames: [] }, // contains "ban" but doesn't start with it
    ];
    const results = searchGazetteer(bangkokAndDurban, "ban");
    assert.equal(results[0].id, "bangkok-th", "a name that starts with the query should outrank one that only contains it");
  });

  test("matches via alias, not just displayName", () => {
    const results = searchGazetteer(gazetteer, "st petersburg");
    assert.ok(results.some((r) => r.id === "saint-petersburg-ru"));
  });

  test("matches via historical name", () => {
    const results = searchGazetteer(gazetteer, "leningrad");
    assert.deepEqual(results.map((r) => r.id), ["saint-petersburg-ru"]);
  });

  test("is diacritic-insensitive", () => {
    const withAccent = searchGazetteer(gazetteer, "bogotá");
    const withoutAccent = searchGazetteer(gazetteer, "bogota");
    assert.deepEqual(withAccent.map((r) => r.id), withoutAccent.map((r) => r.id));
    assert.ok(withAccent.some((r) => r.id === "bogota-co"));
  });

  test("is case-insensitive", () => {
    assert.deepEqual(
      searchGazetteer(gazetteer, "PRAGUE").map((r) => r.id),
      searchGazetteer(gazetteer, "prague").map((r) => r.id)
    );
  });

  test("respects the limit", () => {
    const results = searchGazetteer(gazetteer, "a", 2);
    assert.equal(results.length, 2);
  });

  test("a query matching nothing returns an empty array", () => {
    assert.deepEqual(searchGazetteer(gazetteer, "xyzxyzxyz"), []);
  });
});
