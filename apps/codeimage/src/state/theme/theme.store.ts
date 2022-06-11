import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {createResource, createRoot, mapArray} from 'solid-js';

function generateRandom(min = 0, max = 100) {
  // find diff
  const difference = max - min;

  // generate random number
  let rand = Math.random();

  // multiply with difference
  rand = Math.floor(rand * difference);

  // add with min value
  rand = rand + min;

  return rand;
}

async function deferRandom(i: number) {
  let n = generateRandom(10, 30) * 100;
  if (i < 3) {
    n = generateRandom(5, 10) * 100;
  }
  await new Promise(r => setTimeout(r, n));
}

function $getThemeRegistry() {
  const themes = Object.values(THEME_REGISTRY).map((theme, i) =>
    createResource(() =>
      theme().then(async e => {
        await deferRandom(i);
        return e;
      }),
    ),
  );

  const themeArray = mapArray(
    () => themes,
    ([theme]) => theme,
  );

  return {
    themeResources: themes,
    themeArray,
  };
}

export const themeStore = createRoot($getThemeRegistry);

export function getThemeStore() {
  return themeStore;
}
