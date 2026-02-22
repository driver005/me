// scripts/screenshots.js
import { chromium } from "playwright";

const routes = [
  { path: "/", name: "home", clickSelector: 'button:has-text("Enter")' },
  { path: "/music", name: "music" },
  { path: "/skills", name: "skills" },
];

const BASE_URL = "https://www.a42n.com";

const browser = await chromium.launch({
  headless: false,
  screenshot: "on",
  video: "on",
  args: [
    "--enable-webgl",
    "--enable-gpu",
    "--no-sandbox",
  ],
});

for (const route of routes) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log(`📡 Navigating to ${route.name}...`);

    await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    if (route.clickSelector) {
      console.log(`⏳ Waiting for ${route.name} button...`);

      // 1. Locate the element using Playwright's engine
      const button = page.locator(route.clickSelector);

      // 2. This waits until the button is attached, visible, AND enabled
      // It handles the WebGL loading state perfectly.
      await button.waitFor({ state: "visible", timeout: 0 });

      // 3. Extra check: ensure it's not disabled before clicking
      // Playwright's click() actually waits for "actionability" automatically!
      await button.click();

      console.log(` action clicked, waiting for transition...`);
      await page.waitForTimeout(4000); // Give WebGL extra time to animate
    }

    // Capture the shot
    await page.screenshot({
      path: `static/images/preview_${route.name}.jpg`,
      type: "jpeg",
      quality: 90,
      timeout: 0,
    });

    console.log(`✅ ${route.name} captured`);
  } catch (err) {
    console.error(`❌ Failed on ${route.name}: ${err.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
