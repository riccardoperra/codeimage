import {useI18n} from '@codeimage/locale';
import type {PresetData} from '@codeimage/store/presets/types';
import {editorNotifications} from '@ui/notifications';
import {DropdownMenuItem} from '@ui/DropdownMenu';
import type {AppLocaleEntries} from '../../i18n';
import {toCliConfig} from './cliConfig';

export function CopyCliConfigMenuItem(props: {data: PresetData}) {
  const [t] = useI18n<AppLocaleEntries>();

  async function copyCliConfig() {
    try {
      await navigator.clipboard.writeText(toCliConfig(props.data));
    } catch {
      editorNotifications.show({
        tone: 'danger',
        description: t('cliConfig.copyError'),
        theme: 'page',
      });
      return;
    }
    editorNotifications.show({
      tone: 'success',
      description: t('cliConfig.copied'),
      theme: 'page',
      duration: 2000,
    });
  }

  return (
    <DropdownMenuItem onClick={copyCliConfig}>
      {t('cliConfig.copy')}
    </DropdownMenuItem>
  );
}
