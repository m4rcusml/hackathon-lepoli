import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 12000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/http-backend.mjs",
      url: "http://127.0.0.1:4100/__test/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100/doctor",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        DOCTOR_DEMO_ENABLED: "true",
        DOCTOR_API_UPSTREAM_URL: "http://127.0.0.1:4100/api/doctor/v0/",
      },
    },
  ],
});
