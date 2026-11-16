import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, Tooltip} from '@codeui/kit';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {PlayIcon} from './icons';
import {markPointerToggle} from './timeline/motion';

export function AnimateToggle(props: {iconOnly?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const toggle = (event: MouseEvent) => {
    markPointerToggle(event);
    animation.actions.setOpen(!animation.open());
  };
  return (
    <Tooltip
      content={
        animation.open()
          ? t('animation.timeline.closeMode')
          : t('animation.toolbar')
      }
      placement="top"
    >
      <Button
        size="xs"
        theme="secondary"
        leftIcon={animation.open() ? <CloseIcon /> : <PlayIcon />}
        aria-label={t('animation.toolbar')}
        aria-pressed={animation.open()}
        data-animate-toggle
        onClick={toggle}
      >
        {props.iconOnly ? undefined : t('animation.toolbar')}
      </Button>
    </Tooltip>
  );
}
