import type {AnimationHost} from './contract';

import {measureCode} from '@core/animation/measure';

import {renderBody, frameMarkup, NO_MARKS} from './frameState';
import type {RenderSnapshot} from './frameState';

import {frameSizeCss} from './frameSize';

import type {LoadedFrame, Tab} from './frameState';
export async function measureAnimationCode(
  snapshot: RenderSnapshot,
  loaded: LoadedFrame,
  tabs: Tab[],
  host: AnimationHost,
) {
  const {appearance} = loaded;

  const probe = (code: string): RenderSnapshot['editor'] => ({
    ...snapshot.editor,
    editors: snapshot.editor.editors.map(tab => ({
      ...tab,
      tabName: '',
      ...(tab.id === tabs[0].id
        ? {code, languageId: 'plaintext', lineNumberStart: 1, marks: NO_MARKS}
        : {}),
    })),
  });
  return measureCode(
    async code => {
      const markup = frameMarkup(
        loaded,
        await renderBody(snapshot, loaded, {
          appearance: {...appearance, exportTarget: null, signature: null},
          editorId: tabs[0].id,
          language: null,
          editor: probe(code),
        }),
      );
      return host.layout({...markup, css: [...markup.css, frameSizeCss()]});
    },
    tabs.map(tab => tab.code),
  );
}
