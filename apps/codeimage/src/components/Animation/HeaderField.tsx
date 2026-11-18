import {button as canvasButton} from '../../pages/UnifiedEditor/controls/canvas-toolbar.css';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {TextField} from '@codeimage/ui';
import type {AnimationHeader} from '@core/animation/model';
import {createEffect, createSignal, For, Show, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './AnimatePanel.css';
export function HeaderField() {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const currentTitle = () => animation.settings().header.title;
  const [title, setTitle] = createSignal(untrack(currentTitle));
  createEffect(currentTitle, value => {
    setTitle(value);
  });
  const modes: AnimationHeader['mode'][] = ['tab', 'title', 'tabs'];
  const label = (mode: AnimationHeader['mode']) =>
    t(`animation.header.${mode}`);
  const setMode = (value: string) => {
    const mode = modes.find(mode => mode === value);
    if (mode && mode !== animation.settings().header.mode)
      animation.actions.setHeader({mode});
  };
  const commitTitle = () => {
    if (title().trim() !== animation.settings().header.title)
      animation.actions.setHeader({title: title()});
  };
  const titleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return;
    event.stopPropagation();
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      commitTitle();
    }
  };
  return (
    <div class={styles.header}>
      <select
        class={`${styles.headerSelect} ${canvasButton}`}
        value={animation.settings().header.mode}
        onChange={event => setMode(event.currentTarget.value)}
        aria-label={t('animation.header.label')}
      >
        <For each={modes}>
          {mode => <option value={mode}>{label(mode)}</option>}
        </For>
      </select>
      <Show when={animation.settings().header.mode === 'title'}>
        <label
          class={styles.title}
          onFocusOut={commitTitle}
          onKeyDown={titleKeyDown}
        >
          <span class={styles.barTitleLabel}>
            {t('animation.header.titleField')}
          </span>
          <TextField
            type="text"
            size="xs"
            value={title()}
            onChange={setTitle}
          />
        </label>
      </Show>
    </div>
  );
}
