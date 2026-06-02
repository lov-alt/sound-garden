import { chromium } from "playwright";
import { mkdirSync } from "fs";

const URLS = {
  design: "https://lov-alt.github.io/design-token-studio/",
  motion: "https://lov-alt.github.io/motion-token-studio/",
  sound: "https://lov-alt.github.io/sound-garden/",
};

mkdirSync("/tmp/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const [name, url] of Object.entries(URLS)) {
  console.log(`\n=== ${name}: ${url} ===`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[PAGE ERROR] ${err.message}`));

  await page.goto(url, { timeout: 20000, waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const path = `/tmp/screenshots/${name}-demo.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${path}`);

  const html = await page.locator("#root").innerHTML();
  const preview = html ? html.substring(0, 300) : "(empty)";
  console.log(`Root HTML length: ${html.length}`);
  console.log(`Root HTML preview: ${preview}`);

  if (errors.length) {
    console.log("=== ERRORS ===");
    errors.slice(0, 10).forEach((e) => console.log(e));
  } else {
    console.log("No console errors");
  }

  await page.close();
}

await browser.close();