// Timeout and recoverable-asset-failure tests, required by plan.md
// §17 ("one timeout plus recoverable asset-failure test"). Two
// distinct real-browser scenarios: a round genuinely running out its
// 30-second timer with no interaction, and an image request that fails
// (a recoverable asset failure), confirming both the error path and
// that RETRY actually recovers rather than getting stuck.
import { test, expect } from "@playwright/test";
import { ROUND_DURATION_MS } from "../public/js/scoring.js";

test("a round that times out with no guess scores zero and reveals the answer", async ({ page }) => {
  test.slow(); // this test waits out a real ~30s round timer

  await page.goto("/");
  await page.click("#start-btn");
  await expect(page.locator("#city-search-input")).toBeEnabled();

  // Deliberately do nothing — let the real countdown run out.
  await expect(page.getByText("Time's up")).toBeVisible({ timeout: ROUND_DURATION_MS + 5_000 });
  await expect(page.locator("main")).toContainText("Score this round: 0 / 1000");
  await expect(page.locator("main")).toContainText(/The answer was/);
  await expect(page.locator("#next-btn")).toBeVisible();
});

test("a round that times out with a pin already placed (but not submitted) still counts the guess", async ({ page }) => {
  test.slow(); // this test waits out a real ~30s round timer

  await page.goto("/");
  await page.click("#start-btn");
  await expect(page.locator("#city-search-input")).toBeEnabled();

  // Place a pin but deliberately never click "Submit guess" — the pin
  // itself should still count once the clock runs out.
  const canvas = page.locator("#guess-map canvas");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width * 0.4, y: box.height * 0.5 }, force: true });
  await expect(page.locator("#submit-guess-btn")).toBeEnabled();

  // "Round result", not "Time's up" — reaching this heading at all is
  // most of the proof that the placed pin resolved as a real guess
  // rather than a discarded timeout.
  await expect(page.getByText("Round result")).toBeVisible({ timeout: ROUND_DURATION_MS + 5_000 });
  await expect(page.locator("main")).toContainText(/You guessed near/);
  await expect(page.locator("main")).toContainText(/Score this round: \d+ \/ 1000/);
  await expect(page.locator("#next-btn")).toBeVisible();
});

test("a failed image load shows the error screen, and retry recovers to a playable round", async ({ page }) => {
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // Force every round image to fail, simulating a broken/missing asset
  // — a recoverable failure, distinct from e.g. a corrupt manifest.
  await page.route("**/assets/*.jpg", (route) => route.fulfill({ status: 404, body: "not found" }));

  await page.goto("/");
  await page.click("#start-btn");

  await expect(page.getByText("Something went wrong")).toBeVisible();
  await expect(page.locator("main")).toContainText("image_load_failed");
  const retryButton = page.locator("#retry-btn");
  await expect(retryButton).toBeVisible();

  // Recovery: stop breaking the image, then retry.
  await page.unroute("**/assets/*.jpg");
  await retryButton.click();

  await expect(page.locator("#round-image")).toBeVisible();
  await expect(page.locator("#city-search-input")).toBeEnabled({ timeout: 10_000 });

  expect(consoleErrors, `unexpected page errors: ${consoleErrors.join("; ")}`).toEqual([]);
});
