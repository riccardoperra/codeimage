import {mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {sampleDocument} from '../../packages/render/src/sample.ts';

const out = resolve(process.argv[2] ?? '/tmp/codeimage-cli-watermark/cases');
await mkdir(out, {recursive: true});
const cases = [];
const add = (name, update) => {
  const document = structuredClone(sampleDocument);
  document.scale = 1;
  document.editor.editors[0].code =
    'export const message = "A real shaped line occupying the watermark home";';
  update(document);
  cases.push([name, document]);
};
for (const type of [
  'macOs',
  'macOsGrayTheme',
  'macOsOutlineTheme',
  'windows',
  'card',
  'editor',
  'shell',
]) {
  add(type, doc => {
    doc.terminal.type = type;
  });
}
for (const padding of [16, 32, 64, 128]) {
  add(`padding-${padding}`, doc => {
    doc.frame.padding = padding;
  });
}
add('short', doc => {
  doc.editor.editors[0].code = 'x';
});
add('15-lines', doc => {
  doc.editor.editors[0].code = Array.from(
    {length: 15},
    (_, i) => `const item${i} = "measured code text";`,
  ).join('\n');
});
add('width-minimum', doc => {
  doc.width = 200;
});
add('header-off', doc => {
  doc.terminal.showHeader = false;
});
add('hidden-frame', doc => {
  doc.frame.visible = false;
});
add('transparent-frame', doc => {
  doc.frame.background = 'transparent';
});
add('zero-opacity-frame', doc => {
  doc.frame.opacity = 0;
});
add('image-background', doc => {
  doc.frame.background = 'link:http://127.0.0.1:1/light.png';
});
add('social', doc => {
  doc.frame.exportTarget = 'linkedin-portrait';
});
for (const position of ['bottom-left', 'bottom-center', 'bottom-right']) {
  add(`signature-${position}`, doc => {
    doc.frame.signature = {
      handle: '@a-long-signature-handle-for-collision',
      position,
      style: 'minimal',
    };
  });
}
for (const fontId of ['fira-code', 'space-mono']) {
  add(fontId, doc => {
    doc.editor.options.fontId = fontId;
  });
}
add('tabs', doc => {
  doc.editor.editors.push({
    ...doc.editor.editors[0],
    id: 'second',
    tabName: 'second.ts',
    code: 'x',
  });
});
for (const [name, document] of cases) {
  const file = join(out, `${name}.json`);
  await writeFile(file, JSON.stringify(document, null, 2));
  console.log(file);
}
