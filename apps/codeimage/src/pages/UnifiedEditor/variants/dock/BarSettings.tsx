import {useI18n} from '@codeimage/locale';
import {IconButton} from '@ui/legacy-controls';
import type {AppLocaleEntries} from '../../../../i18n';
import {SettingsIcon} from '../../shell/icons';
import {settings} from '../../shell/settings-state';
import {claimHeaderActions} from '../../shell/header-actions';
import * as styles from './dock.css';

export function BarSettings() {
  const [t] = useI18n<AppLocaleEntries>();
  claimHeaderActions(['commands', 'settings']);
  return (
    <IconButton
      class={styles.item}
      theme={'secondary'}
      variant={'ghost'}
      size={'sm'}
      aria-label={t('editor.settings')}
      title={t('editor.settings')}
      aria-haspopup="dialog"
      aria-expanded={settings.isOpen()}
      data-settings-trigger
      onClick={() => settings.open()}
    >
      <SettingsIcon size={16} />
    </IconButton>
  );
}
