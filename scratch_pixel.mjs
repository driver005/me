import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/home/default/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/segerman', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const result = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.clone-canvas');
  const gl = canvas.getContext('webgl2');
  const w = canvas.width, h = canvas.height;
  const px = new Uint8Array(4);
  const samples = [];
  const pts = [[0.5,0.7],[0.1,0.3],[0.9,0.2],[0.5,0.5]];
  for (const [u,v] of pts) {
    const x = Math.floor(u*w), y = Math.floor(v*h);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    samples.push({x,y,rgba:[...px]});
  }
  return { w, h, samples };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
