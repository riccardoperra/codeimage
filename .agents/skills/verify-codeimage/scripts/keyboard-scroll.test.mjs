import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {test} from 'node:test';

const require = createRequire(
  new URL('../../../../apps/codeimage/package.json', import.meta.url),
);
const {Window} = require('happy-dom');
const commonjs =
  process.env.VERIFY_KOBALTE_UTILS ?? require.resolve('@kobalte/utils');

test('hidden-root traversal terminates through nested scroll parents', async () => {
  const window = new Window();
  const previous = {window: globalThis.window, document: globalThis.document};
  globalThis.window = window;
  globalThis.document = window.document;
  try {
    const utils = await import(new URL('index.js', pathToFileURL(commonjs)));
    document.documentElement.style.overflow = 'hidden';
    document.body.innerHTML =
      '<div style="overflow:auto"><div style="overflow:scroll"><button>Open menu</button></div></div>';
    const outer = document.body.firstElementChild;
    const inner = outer.firstElementChild;
    const trigger = inner.firstElementChild;
    const computedStyle = window.getComputedStyle.bind(window);
    const visited = [];
    window.getComputedStyle = element => {
      visited.push(element);
      assert.ok(
        visited.length < 32,
        'scrollIntoViewport must progress rather than revisit the same scroll parent forever',
      );
      return computedStyle(element);
    };
    utils.scrollIntoViewport(trigger);
    assert.ok(visited.includes(inner));
    assert.ok(
      visited.includes(outer),
      'nested traversal reaches the outer scroll container',
    );
    assert.equal(document.documentElement.scrollTop, 0);
    assert.equal(
      utils.getScrollParent(inner),
      inner,
      'exported getScrollParent still includes its starting element',
    );
    utils.scrollIntoViewport(inner);
    const detached = document.createElement('button');
    utils.scrollIntoViewport(detached);
  } finally {
    Object.assign(globalThis, previous);
    await window.happyDOM.close();
  }
});
