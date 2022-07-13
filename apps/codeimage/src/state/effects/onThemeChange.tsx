import {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getFrameState} from '@codeimage/store/frame/createFrame';
import {getTerminalState} from '@codeimage/store/terminal/createTerminal';
import {createAction, createEffect, ofType, props} from '@ngneat/effects';
import {tap} from 'rxjs';
import {batch} from 'solid-js';

export const updateTheme = createAction(
  '[CodeImage] Update Theme',
  props<{theme: CustomTheme}>(),
);

export const onThemeChange$ = createEffect(actions =>
  actions.pipe(
    ofType(updateTheme),
    tap(({theme}) => {
      const frame = getFrameState();
      frame.setBackground(theme.properties.previewBackground);

      const terminal = getTerminalState();
      batch(() => {
        terminal.setState('background', theme.properties.terminal.main);
        terminal.setState('textColor', theme.properties.terminal.text);
      });

      const editor = getRootEditorStore();
      editor.actions.setThemeId(theme.id);
    }),
  ),
);
