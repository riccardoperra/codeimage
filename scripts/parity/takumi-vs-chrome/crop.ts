import {PNG} from 'pngjs';
import {type Region} from './browser';
export function cropPng(bytes: Uint8Array, {x, y, width, height}: Region) {
  const source = PNG.sync.read(Buffer.from(bytes));
  const crop = new PNG({width, height});
  PNG.bitblt(source, crop, x, y, width, height, 0, 0);
  return PNG.sync.write(crop);
}
