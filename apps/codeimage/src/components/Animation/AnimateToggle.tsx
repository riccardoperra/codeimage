import {button as canvasButton} from '../../pages/UnifiedEditor/controls/canvas-toolbar.css';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button} from '@codeimage/ui';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {PlayIcon} from './icons';
import {markPointerToggle} from './timeline/input';

export function AnimateToggle(props: {iconOnly?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const toggle = (event: MouseEvent) => {
    markPointerToggle(event);
    animation.actions.setOpen(!animation.open());
  };
  return (
    <Button
      title={
        animation.open()
          ? t('animation.timeline.closeMode')
          : t('animation.toolbar')
      }
      class={canvasButton}
      size="xs"
      theme="secondary"
      leftIcon={animation.open() ? <CloseIcon /> : <PlayIcon />}
      aria-label={t('animation.toolbar')}
      aria-pressed={animation.open() ? 'true' : 'false'}
      data-animate-toggle
      onClick={toggle}
    >
      {props.iconOnly ? undefined : t('animation.toolbar')}
    </Button>
  );
}
