import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button} from '@codeui/kit';
import type {AppLocaleEntries} from '../../i18n';

export function TypewriterToggle() {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const on = () => animation.settings().typewriter === true;
  return (
    <Button
      size="xs"
      theme={on() ? 'primary' : 'secondary'}
      aria-pressed={on()}
      data-animation-typewriter
      onClick={() => animation.actions.setTypewriter(!on())}
    >
      {t('animation.typewriter')}
    </Button>
  );
}
