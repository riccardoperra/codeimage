import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button} from '@codeui/kit';
import type {AppLocaleEntries} from '../../i18n';
import {PlayIcon} from './icons';
export function AnimateToggle(props: {iconOnly?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const toggle = () => animation.actions.setOpen(!animation.open());
  return (
    <Button
      size="xs"
      theme="secondary"
      leftIcon={<PlayIcon />}
      aria-label={t('animation.toolbar')}
      title={t('animation.toolbar')}
      aria-pressed={animation.open()}
      data-animate-toggle
      onClick={toggle}
    >
      {props.iconOnly ? undefined : t('animation.toolbar')}
    </Button>
  );
}
