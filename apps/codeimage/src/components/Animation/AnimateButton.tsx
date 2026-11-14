import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button} from '@codeui/kit';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {PlayIcon} from './icons';

// A single tab has nothing to animate.
export function AnimateButton(props: {showLabel: boolean}) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Show when={editor.state.editors.length > 1}>
      <Button
        size={'xs'}
        theme={animation.open() ? 'primary' : 'secondary'}
        leftIcon={<PlayIcon />}
        aria-label={props.showLabel ? undefined : t('animation.toolbar')}
        aria-pressed={animation.open()}
        onClick={() => animation.actions.setOpen(!animation.open())}
      >
        {props.showLabel ? t('animation.toolbar') : undefined}
      </Button>
    </Show>
  );
}
