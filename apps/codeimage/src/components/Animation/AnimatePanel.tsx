import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {createSignal, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {PhoneSteps} from './PhoneSteps';
import {TransportBar} from './TransportBar';
import {StripTimeline} from './StripTimeline';
import {SegmentDetails} from './SegmentDetails';
import {HeaderField} from './HeaderField';
import * as styles from './AnimatePanel.css';
export function AnimatePanel(props: {compact: boolean}) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [dense, setDense] = createSignal(false);
  const compact = () => props.compact || dense();
  let island!: HTMLElement;
  const keyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.preventDefault();
    const selected = animation.selection();
    if (selected) {
      // Clearing the selection removes the details row, which may hold focus.
      island
        .querySelector<HTMLElement>(
          `[data-animation-segment][data-step-id="${CSS.escape(selected.stepId)}"][data-kind="${selected.kind}"]`,
        )
        ?.focus();
      animation.actions.select(null);
    } else {
      animation.actions.edit();
      editor.activeEditorView()?.focus();
    }
  };
  return (
    <Show when={animation.open()}>
      <section
        ref={island}
        class={styles.island}
        aria-label={t('animation.panel')}
        data-animate-panel
        on:keydown={keyDown}
      >
        <TransportBar compact={compact()} />
        <StripTimeline overview={compact()} onDensityChange={setDense} />
        <Show when={compact()} fallback={<SegmentDetails />}>
          <PhoneSteps />
        </Show>
        <Show when={compact()}>
          <HeaderField />
        </Show>
      </section>
    </Show>
  );
}
