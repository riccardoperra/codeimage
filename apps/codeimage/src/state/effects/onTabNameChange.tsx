import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {editorLanguageId$} from '@codeimage/store/editor';
import {createAction, createEffect, ofType, props} from '@ngneat/effects';
import {filterNil} from '@ngneat/elf';
import {debounceTime, map, tap, withLatestFrom} from 'rxjs';

export const updateTabName = createAction(
  '[CodeImage] Update Tab Name',
  props<{tabName: string}>(),
);

// TODO: fix
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
      const matches = SUPPORTED_LANGUAGES.filter(language => {
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
    // tap(setLanguageId),
  ),
);
