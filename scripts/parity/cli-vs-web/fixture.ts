import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function fontFaces(root: string) {
  const codeFont = (
    await readFile(
      join(
        root,
        'packages/render/node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
      ),
    )
  ).toString('base64');
  const uiFont = (
    await readFile(
      join(
        root,
        'packages/render/node_modules/inter-ui/variable/InterVariable.woff2',
      ),
    )
  ).toString('base64');
  const faces = `<style>${[400, 500, 600, 650, 700, 800].map(weight => `@font-face{font-family:'Jetbrains Mono';src:url(data:font/woff2;base64,${codeFont});font-weight:${weight};font-style:normal}@font-face{font-family:'Inter var';src:url(data:font/woff2;base64,${uiFont});font-weight:${weight};font-style:normal}`).join('')}</style>`;
  return faces;
}
export async function createFixture(app: string, faces: string) {
  const temporary = await mkdtemp(join(app, 'src/render/.p10-'));
  const source = `
import '/src/assets/styles/app.scss';
import '/src/theme/global.css';
import {render} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import {getEditorStore} from '/src/state/editor';
import {getThemeStore} from '/src/state/theme/theme.store';
import {THEME_REGISTRY} from '/src/state/theme/themeRegistry';
import {loadLanguage} from '/src/core/snapshot/tokenize';
import {PreviewFrame} from '/src/components/Frame/PreviewFrame';
import {createRasterizer} from '/src/core/rasterize';
import {toCliConfig} from '/src/components/Presets/cliConfig';
document.head.insertAdjacentHTML('beforeend', ${JSON.stringify(faces)});
let dispose;
window.prepare = async snapshot => {
  dispose?.();
  const theme = await THEME_REGISTRY.find(theme => theme.id === snapshot.editor.options.themeId).load();
  const tab = snapshot.editor.editors[0];
  const language = await loadLanguage(tab.languageId, tab.tabName);
  let ref;
  const Setup = () => {
    const store = getEditorStore();
    store.editor.actions.setFromPersistedState(snapshot.editor);
    store.frame.setFromPersistedState({...snapshot.frame, background: snapshot.frame.background ?? theme.properties.previewBackground});
    store.frame.setWidth(snapshot.width ?? 0);
    store.frame.setHeight(0);
    store.terminal.setFromPersistedState({...snapshot.terminal, background: snapshot.terminal.background || theme.properties.terminal.main, textColor: snapshot.terminal.textColor || theme.properties.terminal.text});
    getThemeStore().getThemeResource(theme.id)[1].mutate(theme);
    return <PreviewFrame ref={node => ref = node} language={language} />;
  };
  dispose = render(() => <StateProvider><Setup /></StateProvider>, document.getElementById('root'));
  await document.fonts.load('400 16px "Jetbrains Mono"');
  await document.fonts.load('400 16px "Inter var"');
  await document.fonts.ready;
  await document.fonts.load('500 16px "CodeImage Signature"');
  await document.fonts.load('650 16px "CodeImage Signature"');
  await Promise.all([...ref.querySelectorAll('img')].map(image => image.decode()));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const store = getEditorStore();
  const preset = toCliConfig({frame: store.frame.stateToPersist(), terminal: store.terminal.stateToPersist(), editor: {...snapshot.editor.options}});
  const image = await createRasterizer('dom-export', 'dataUrl')(ref, {format: 'png', pixelRatio: snapshot.frame.exportTarget ? 1 : snapshot.scale, quality: 1, codeFont: store.editor.computed.selectedFont()});
  return {preset, image};
};
`;
  await writeFile(join(temporary, 'browser.tsx'), source);

  await writeFile(
    join(temporary, 'index.html'),
    '<!doctype html><div id="root"></div><script type="module" src="./browser.tsx"></script>',
  );
  return temporary;
}
