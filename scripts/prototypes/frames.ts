import {resolve} from 'node:path';
import {chromium} from 'playwright';

// Grabs frames of a recorded video at the given seconds, and prints its length.
const [video, prefix, times] = process.argv.slice(2);
const browser = await chromium.launch({channel: 'chrome'});
const page = await browser.newPage({viewport: {width: 1440, height: 900}});
await page.goto(`file://${resolve(video)}`);
const duration = await page.evaluate(async () => {
  const v = document.querySelector('video')!;
  await new Promise(r => (v.readyState >= 1 ? r(null) : v.addEventListener('loadedmetadata', r)));
  if (!Number.isFinite(v.duration)) {
    v.currentTime = 1e9;
    await new Promise(r => v.addEventListener('timeupdate', r, {once: true}));
  }
  return v.duration;
});
console.log('duration', duration);
for (const t of (times ?? '').split(',').filter(Boolean)) {
  await page.evaluate(async t => {
    const v = document.querySelector('video')!;
    v.pause();
    v.currentTime = t;
    await new Promise(r => v.addEventListener('seeked', r, {once: true}));
  }, Number(t));
  await page.locator('video').screenshot({path: `${prefix}-${t}.png`});
}
await browser.close();
