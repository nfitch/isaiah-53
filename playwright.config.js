// @ts-check
const { defineConfig, devices } = require("@playwright/test");

// The project root is served so the page is loaded from a subpath (/static/), as on GitHub Pages.
module.exports = defineConfig({
  testDir: "tests",
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:8053/static/", ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
  webServer: {
    command: "python3 -m http.server 8053 --bind 127.0.0.1",
    url: "http://127.0.0.1:8053/static/index.html",
    reuseExistingServer: false,
  },
});
