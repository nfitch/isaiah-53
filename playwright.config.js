// @ts-check
const { defineConfig, devices } = require("@playwright/test");

// The project root is served so the page is loaded from a subpath (/static/), as on GitHub Pages.
const baseURL = "http://127.0.0.1:8053/static/";

module.exports = defineConfig({
  testDir: "tests",
  reporter: [["list"]],
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /mobile\.spec/,
      use: { baseURL, ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    // Phone tests run in WebKit (Safari's engine) and Chromium, portrait and landscape.
    { name: "phone-webkit", testMatch: /mobile\.spec/, use: { baseURL, ...devices["iPhone 13"] } },
    { name: "phone-webkit-landscape", testMatch: /mobile\.spec/, use: { baseURL, ...devices["iPhone 13 landscape"] } },
    { name: "phone-chromium", testMatch: /mobile\.spec/, use: { baseURL, ...devices["Pixel 7"] } },
    { name: "phone-chromium-landscape", testMatch: /mobile\.spec/, use: { baseURL, ...devices["Pixel 7 landscape"] } },
  ],
  webServer: {
    command: "python3 -m http.server 8053 --bind 127.0.0.1",
    url: "http://127.0.0.1:8053/static/index.html",
    reuseExistingServer: false,
  },
});
