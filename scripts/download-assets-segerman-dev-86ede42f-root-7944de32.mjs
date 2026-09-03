import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const BASE = 'https://segerman.dev/media/work';
const WORK = ['estrela', 'yucca', 'zulik', 'payjustnow', 'vineyard'];
const ROOT = 'static/sites/segerman-dev-86ede42f/root-7944de32';
const assets = [];
for (const w of WORK) {
  assets.push({ url: `${BASE}/${w}/featured.webp`, out: join(ROOT, 'work', `${w}-featured.webp`) });
  assets.push({ url: `${BASE}/${w}/featured.mp4`, out: join(ROOT, 'work', `${w}-featured.mp4`) });
}

async function dl(a) {
  const res = await fetch(a.url);
  if (!res.ok) { console.log('FAIL', res.status, a.url); return; }
  mkdirSync(dirname(a.out), { recursive: true });
  writeFileSync(a.out, Buffer.from(await res.arrayBuffer()));
  console.log('OK', a.out, res.headers.get('content-length'));
}

(async () => {
  for (let i = 0; i < assets.length; i += 4) {
    await Promise.all(assets.slice(i, i + 4).map(dl));
  }
  console.log('done', assets.length);
})();
