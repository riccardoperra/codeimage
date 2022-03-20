import {createAction, createEffect, ofType, props} from '@ngneat/effects';
import {CustomTheme} from '@codeimage/theme';
import {debounceTime, map, tap, withLatestFrom} from 'rxjs';
import {editorLanguageId$, setLanguageId, updateEditorStore} from './editor';
import {filterNil, setProps} from '@ngneat/elf';
import {updateFrameStore} from './frame';
import {updateTerminalStore} from './terminal';
import {appEnvironment} from '../core/configuration';

export const updateTabName = createAction(
  '[CodeImage] Update Tab Name',
  props<{tabName: string}>(),
);

export const updateTheme = createAction(
  '[CodeImage] Update Theme',
  props<{theme: CustomTheme}>(),
);

export const onTabNameChange$ = createEffect(actions =>
  actions.pipe(
    ofType(updateTabName),
    debounceTime(100),
    withLatestFrom(editorLanguageId$),
    map(([{tabName}, languageId]) => ({
      tabName,
      languageId,
    })),
    map(({tabName, languageId}) => {
      const matches = appEnvironment.languages.filter(language => {
        return language.icons.some(({matcher}) => matcher.test(tabName));
      });

      if (
        !matches.length ||
        matches.map(match => match.id).includes(languageId)
      ) {
        return;
      }
      return matches[0].id;
    }),
    filterNil(),
    tap(setLanguageId),
  ),
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

      updateEditorStore(setProps({themeId: theme.id}));
    }),
  ),
);
