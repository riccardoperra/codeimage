import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Select, TextField} from '@codeui/kit';
import type {AnimationHeader} from '@core/animation/model';
import {createEffect, createSignal, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './AnimatePanel.css';
export function HeaderField() {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [title, setTitle] = createSignal(animation.settings().header.title);
  createEffect(() => setTitle(animation.settings().header.title));
  const modes: AnimationHeader['mode'][] = ['tab', 'title', 'tabs'];
  const label = (mode: AnimationHeader['mode']) =>
    t(`animation.header.${mode}`);
  const setMode = (mode: AnimationHeader['mode'] | null) => {
    if (mode && mode !== animation.settings().header.mode)
      animation.actions.setHeader({mode});
  };
  const commitTitle = () => {
    if (title().trim() !== animation.settings().header.title)
      animation.actions.setHeader({title: title()});
  };
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return;
    event.stopPropagation();
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      event.target.blur();
    }
  };
  return (
    <div class={styles.header} on:keydown={keyDown}>
      <Select<AnimationHeader['mode']>
        size="xs"
        options={modes}
        value={animation.settings().header.mode}
        onChange={setMode}
        itemLabel={label}
        optionTextValue={label}
        valueComponent={value => label(value())}
        aria-label={t('animation.header.label')}
        disallowEmptySelection
      />
      <Show when={animation.settings().header.mode === 'title'}>
        <div class={styles.title} onFocusOut={commitTitle}>
          <TextField
            size="xs"
            value={title()}
            onChange={setTitle}
            label={t('animation.header.titleField')}
          />
        </div>
      </Show>
    </div>
  );
}
