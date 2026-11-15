import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {TransportBar} from './TransportBar';
import {StripTimeline} from './StripTimeline';
import {SegmentDetails} from './SegmentDetails';
import {HeaderField} from './HeaderField';
import * as styles from './AnimatePanel.css';
import {Match, Switch} from 'solid-js';
import {FitStrip} from './proto/FitStrip';
import {Overview} from './proto/Overview';
import {ProtoPicker} from './proto/Picker';
import {PreviewOnly} from './proto/PreviewOnly';
import {Scrubber} from './proto/Scrubber';
import {StepList} from './proto/StepList';
import {surface} from './proto/variant';
export function AnimatePanel() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  let island!: HTMLElement;
  const keyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    // Prototype: an open step editor owns Escape.
    if (document.querySelector('[data-proto-step-editor]')) return;
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
    <>
      <Show when={import.meta.env.DEV}>
        <ProtoPicker />
      </Show>
      <Show when={animation.open()}>
        <section
          ref={island}
          class={styles.island}
          aria-label={t('animation.panel')}
          data-animate-panel
          on:keydown={keyDown}
        >
          <Switch>
            <Match when={surface() === 'strip'}>
              <TransportBar />
              <StripTimeline />
              <SegmentDetails />
              <div class={styles.mobileHeader}>
                <HeaderField />
              </div>
            </Match>
            <Match when={surface() === 'preview'}>
              <PreviewOnly />
            </Match>
            <Match when={surface() === 'list'}>
              <TransportBar />
              <Scrubber />
              <StepList />
              <div class={styles.mobileHeader}>
                <HeaderField />
              </div>
            </Match>
            <Match when={surface() === 'fit'}>
              <TransportBar />
              <FitStrip />
              <SegmentDetails />
              <div class={styles.mobileHeader}>
                <HeaderField />
              </div>
            </Match>
            <Match when={surface() === 'hybrid'}>
              <TransportBar />
              <Overview />
              <StepList />
              <div class={styles.mobileHeader}>
                <HeaderField />
              </div>
            </Match>
          </Switch>
        </section>
      </Show>
    </>
  );
}
