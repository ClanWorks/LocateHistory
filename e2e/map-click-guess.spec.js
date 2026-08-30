// The GeoGuessr-style click-to-guess map (public/js/guess-map.js) is the
// primary way to submit a guess; the text search covered by
// complete-session.spec.js is the accessible alternative for anyone who
// can't use the map. This test exercises the map path specifically,
// against the real built site (self-hosted MapLibre GL JS + a self-hosted
// Protomaps vector basemap, no CDN or external tile service involved).
import { test, expect } from "@playwright/test";

test("clicking the map places a guess, enables submit, and reaches the reveal screen", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto("/");
  await page.click("#start-btn");
  await expect(page.locator("#city-search-input")).toBeEnabled();

  // The map is only mounted once the round image is ready (same gating
  // as the search input) — its canvas appearing is the signal it's live.
  const canvas = page.locator("#guess-map canvas");
  await expect(canvas).toBeVisible();

  await expect(page.locator("#submit-guess-btn")).toBeDisabled();
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 }, force: true });

  await expect(page.locator("#selected-city")).toContainText("Selected:");
  await expect(page.locator("#submit-guess-btn")).toBeEnabled();
  await page.click("#submit-guess-btn");

  await expect(page.locator("#next-btn")).toBeVisible();
  await expect(page.locator("main")).toContainText(/Score this round: \d+ \/ 1000/);
  await expect(page.locator("main")).toContainText(/You guessed near/);

  expect(consoleErrors, `unexpected console errors: ${consoleErrors.join("; ")}`).toEqual([]);
});

test("selecting a city from the search moves the map's marker to match", async ({ page }) => {
  await page.goto("/");
  await page.click("#start-btn");
  await expect(page.locator("#city-search-input")).toBeEnabled();
  await expect(page.locator("#guess-map canvas")).toBeVisible();

  await page.fill("#city-search-input", "a");
  if ((await page.locator("#city-search-results li button").count()) === 0) {
    await page.fill("#city-search-input", "e");
  }
  await page.locator("#city-search-results li button").first().click();

  await expect(page.locator("#submit-guess-btn")).toBeEnabled();
  // The map places its own marker for a search-selected guess too (see
  // activeGuessMap.setGuess in app.js) — same underlying pendingGuess,
  // just reached via the accessible path instead of a click.
  await expect(page.locator("#guess-map .maplibregl-marker")).toBeVisible();
});
