import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Show, untrack} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {TransportBar, transportInBar} from './TransportBar';
import {HeaderField} from './HeaderField';
import {curve, reduced, timelineFor, toggledByPointer} from './timeline/motion';
import {Timeline} from './timeline/Timeline';
import * as styles from './AnimatePanel.css';
function rise(element: HTMLElement, afterBar: boolean) {
  if (!toggledByPointer()) return;
  element.animate(
    reduced()
      ? [{opacity: 0}, {opacity: 1}]
      : [
          {opacity: 0, translate: '0 8px'},
          {opacity: 1, translate: '0 0'},
        ],
    {
      duration: timelineFor.open,
      delay: afterBar ? timelineFor.openAfterBar : 0,
      easing: curve.out,
      fill: 'backwards',
    },
  );
}
export function AnimatePanel(props: {compact: boolean}) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  let island!: HTMLElement;
  const keyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.preventDefault();
    const selected = animation.selection();
    if (selected) {
      island
        .querySelector<HTMLElement>(
          `[data-animation-segment][data-step-id="${CSS.escape(selected.stepId)}"][data-kind="${selected.kind}"]`,
        )
        ?.focus();
      animation.actions.select(null);
    } else {
      animation.actions.setOpen(false);
      editor.activeEditorView()?.focus();
    }
  };
  return (
    <Show when={animation.open()}>
      <section
        ref={element => {
          island = element;
          queueMicrotask(() =>
            untrack(() => rise(element, transportInBar(props.compact))),
          );
        }}
        class={styles.island}
        aria-label={t('animation.panel')}
        data-animate-panel
        onKeyDown={keyDown}
      >
        <Show when={!transportInBar(props.compact)}>
          <TransportBar compact={props.compact} />
        </Show>
        <Timeline compact={props.compact} />
        <div class={styles.mobileHeader}>
          <HeaderField />
        </div>
      </section>
    </Show>
  );
}
