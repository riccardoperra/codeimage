import {useSelectContext} from '@kobalte/core/select';
import {button as canvasButton} from '../../pages/UnifiedEditor/controls/canvas-toolbar.css';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Select, TextField} from '@codeui/kit';
import type {AnimationHeader} from '@core/animation/model';
import {createEffect, createSignal, onCleanup, Show} from 'solid-js';
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
  // Keeps typed keys from the app's body hotkeys. Only around the text field:
  // stopping a key here also stops Solid's delegated handlers, which the
  // Select's keyboard navigation uses.
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
      <Select<AnimationHeader['mode']>
        size="xs"
        options={modes}
        value={animation.settings().header.mode}
        onChange={setMode}
        itemLabel={label}
        optionTextValue={label}
        valueComponent={value => <HeaderValue label={label(value())} />}
        aria-label={t('animation.header.label')}
        disallowEmptySelection
      />
      <Show when={animation.settings().header.mode === 'title'}>
        <div
          class={styles.title}
          onFocusOut={commitTitle}
          on:keydown={titleKeyDown}
        >
          <TextField
            slotClasses={{label: styles.barTitleLabel}}
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

function HeaderValue(props: {label: string}) {
  const select = useSelectContext();
  createEffect(() => {
    const trigger = select.triggerRef();
    if (!trigger) return;
    trigger.classList.add(canvasButton);
    onCleanup(() => trigger.classList.remove(canvasButton));
  });
  return <>{props.label}</>;
}
