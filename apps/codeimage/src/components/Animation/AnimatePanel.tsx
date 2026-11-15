import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {TransportBar} from './TransportBar';
import {StripTimeline} from './StripTimeline';
import {SegmentDetails} from './SegmentDetails';
import {HeaderField} from './HeaderField';
import * as styles from './AnimatePanel.css';
export function AnimatePanel() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const keyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.preventDefault();
    if (animation.selection()) animation.actions.select(null);
    else {
      animation.actions.edit();
      editor.activeEditorView()?.focus();
    }
  };
  return (
    <Show when={animation.open()}>
      <section
        class={styles.island}
        aria-label={t('animation.panel')}
        data-animate-panel
        on:keydown={keyDown}
      >
        <TransportBar />
        <StripTimeline />
        <div class={styles.mobileHeader}>
          <HeaderField />
        </div>
        <SegmentDetails />
      </section>
    </Show>
  );
}
