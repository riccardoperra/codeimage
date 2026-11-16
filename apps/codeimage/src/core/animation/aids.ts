import {createSignal} from 'solid-js';

const [rasterizing, setRasterizing] = createSignal(0);

export const animateAidsHidden = () => rasterizing() > 0;

export async function withoutAnimateAids<T>(run: () => Promise<T>) {
  setRasterizing(count => count + 1);
  try {
    return await run();
  } finally {
    setRasterizing(count => count - 1);
  }
}
