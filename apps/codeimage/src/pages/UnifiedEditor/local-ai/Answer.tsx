import {useI18n} from '@codeimage/locale';
import {Button} from '@codeui/kit';
import {createSignal, createTrackedEffect, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './local-ai.css';

export function Answer(props: {text: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [expanded, setExpanded] = createSignal(false);
  const [clipped, setClipped] = createSignal(false);
  const [paragraph, setParagraph] = createSignal<HTMLParagraphElement>();
  createTrackedEffect(() => {
    void props.text;
    const element = paragraph();
    if (!element || expanded()) return;
    const line = parseFloat(getComputedStyle(element).lineHeight) || 16;
    setClipped(element.scrollHeight - element.clientHeight > line / 2);
  });
  return (
    <>
      <p
        ref={setParagraph}
        class={styles.answer}
        data-local-ai-answer
        data-clamped={expanded() ? undefined : ''}
      >
        {props.text}
      </p>
      <Show when={clipped()}>
        <Button
          class={styles.panelAction}
          size="xs"
          variant="secondary"
          ghost
          aria-expanded={expanded() ? 'true' : 'false'}
          data-local-ai-show-all
          onClick={() => setExpanded(open => !open)}
        >
          {expanded() ? t('localAi.showLess') : t('localAi.showAll')}
        </Button>
      </Show>
    </>
  );
}
