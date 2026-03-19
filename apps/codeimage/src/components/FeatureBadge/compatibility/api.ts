import {type Identifier} from './types';

export function getWindowMdnCompatibilityApi() {
  return fetch(
    'https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Window.json',
  ).then(res => res.json() as Promise<{api: {Window: Identifier['Window']}}>);
}
