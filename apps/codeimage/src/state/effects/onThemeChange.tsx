import {getRootEditorsState, updateEditorStore} from '@codeimage/store/editor';
import {updateFrameStore} from '@codeimage/store/frame';
import {updateTerminalStore} from '@codeimage/store/terminal';
import {CustomTheme} from '@codeimage/theme';
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
      updateFrameStore(
        setProps({background: theme.properties.previewBackground}),
      );

      updateTerminalStore(
        setProps({
          background: theme.properties.terminal.main,
          textColor: theme.properties.terminal.text,
          darkMode: theme.properties.darkMode,
        }),
      );

      const editor = getRootEditorsState();
      editor.setThemeId(theme.id);
    }),
  ),
);
