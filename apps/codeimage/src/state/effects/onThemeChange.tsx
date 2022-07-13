import {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getFrameState} from '@codeimage/store/frame/createFrame';
import {updateTerminalStore} from '@codeimage/store/terminal';
import {createAction, createEffect, ofType, props} from '@ngneat/effects';
import {setProps} from '@ngneat/elf';
import {tap} from 'rxjs';

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

      updateTerminalStore(
        setProps({
          background: theme.properties.terminal.main,
          textColor: theme.properties.terminal.text,
          darkMode: theme.properties.darkMode,
        }),
      );

      const editor = getRootEditorStore();
      editor.actions.setThemeId(theme.id);
    }),
  ),
);
