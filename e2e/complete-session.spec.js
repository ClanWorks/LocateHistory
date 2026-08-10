// End-to-end complete-session test, required by plan.md §17. Plays a
// full ten-round session against the real built site (manifest,
// gazetteer, images — everything in public/, not fixtures), through to
// Results and Replay, in a real browser. Everything below it (state
// machine, scoring, media pipeline) already has exhaustive unit
// coverage; this test exists specifically to catch integration bugs
// that only show up when all of it is wired together in the DOM — the
// kind of bug M3's review process found repeatedly (stale selection on
// edit, timer starting before the image was ready, an orphaned image
// callback able to hijack a later round's timer).
import { test, expect } from "@playwright/test";
import { REQUIRED_ROUNDS } from "../public/js/state-machine.js";

test("a full session completes from intro through results, replay, and best-score persistence", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How to play" })).toBeVisible();
  await page.click("#start-btn");

  for (let round = 1; round <= REQUIRED_ROUNDS; round++) {
    await expect(page.locator("h2")).toHaveText(`Round ${round} of ${REQUIRED_ROUNDS}`);
    await expect(page.locator("#round-image")).toBeVisible();

    // Controls are locked until the image is ready (M3 review fix) —
    // wait for that before interacting, same as a real player would.
    await expect(page.locator("#city-search-input")).toBeEnabled();

    await page.fill("#city-search-input", "a");
    if ((await page.locator("#city-search-results li button").count()) === 0) {
      await page.fill("#city-search-input", "e"); // fall back if "a" happens to match nothing this round
    }
    await page.locator("#city-search-results li button").first().click();
    await expect(page.locator("#submit-guess-btn")).toBeEnabled();
    await page.click("#submit-guess-btn");

    await expect(page.locator("#next-btn")).toBeVisible();
    // Every round must show a real score breakdown, not a blank/NaN one.
    await expect(page.locator("main")).toContainText(/Score this round: \d+ \/ 1000/);
    await page.click("#next-btn");
  }

  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.locator("main")).toContainText(new RegExp(`Total score: \\d+ / ${REQUIRED_ROUNDS * 1000}`));
  await expect(page.locator("#results-breakdown li")).toHaveCount(REQUIRED_ROUNDS);

  const bestScore = await page.evaluate(() => localStorage.getItem("photolocation:bestScore"));
  expect(Number(bestScore)).toBeGreaterThan(0);

  await page.click("#replay-btn");
  await expect(page.locator("h2")).toHaveText("Round 1 of 10");
  await expect(page.locator("#round-image")).toBeVisible();

  expect(consoleErrors, `unexpected console errors: ${consoleErrors.join("; ")}`).toEqual([]);
});
