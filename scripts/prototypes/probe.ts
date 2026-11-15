import {launch, open} from './lib.ts';
const [route, out, w, h] = process.argv.slice(2);
const {browser, page} = await launch({width: Number(w ?? 1440), height: Number(h ?? 900)});
await open(page, 'http://localhost:4377/', route);
await page.screenshot({path: out});
await browser.close();
