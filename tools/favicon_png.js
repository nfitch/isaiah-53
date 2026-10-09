// Render static/favicon.svg to PNG fallbacks (32px favicon, 180px Apple touch icon). Run: node tools/favicon_png.js
const { chromium } = require("@playwright/test");
const fs = require("fs");
(async () => {
  const svg = fs.readFileSync("static/favicon.svg", "utf8");
  const b = await chromium.launch();
  for (const [size, out] of [[32, "static/favicon-32.png"], [180, "static/apple-touch-icon.png"]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${size}" height="${size}">`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: out, omitBackground: true });
  }
  await b.close();
})();
