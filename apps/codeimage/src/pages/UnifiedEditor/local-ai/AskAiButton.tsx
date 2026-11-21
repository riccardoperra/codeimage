import {useI18n} from '@codeimage/locale';
import {Button} from '@codeui/kit';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {PromptIcon} from '../shell/icons';
import {localAi} from './LocalAi';

export function AskAiButton(props: {class?: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Show when={localAi.enabled()}>
      <Button
        class={props.class}
        size="sm"
        variant="secondary"
        ghost
        leftIcon={<PromptIcon size={18} />}
        data-ask-ai
        onClick={() => localAi.open()}
      >
        {t('localAi.ask')}
      </Button>
    </Show>
  );
}
