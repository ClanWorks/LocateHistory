// @ts-check
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // several tests deliberately let a real 30s round timer expire
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-static.js 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
