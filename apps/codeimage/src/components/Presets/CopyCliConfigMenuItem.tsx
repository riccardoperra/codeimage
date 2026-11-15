import {useI18n} from '@codeimage/locale';
import type {PresetData} from '@codeimage/store/presets/types';
import {toast} from '@codeimage/ui';
import {DropdownMenuItem} from '@codeui/kit';
import type {AppLocaleEntries} from '../../i18n';
import {toCliConfig} from './cliConfig';

export function CopyCliConfigMenuItem(props: {data: PresetData}) {
  const [t] = useI18n<AppLocaleEntries>();

  async function copyCliConfig() {
    try {
      await navigator.clipboard.writeText(toCliConfig(props.data));
    } catch {
      toast.error(t('cliConfig.copyError'), {position: 'bottom-center'});
      return;
    }
    toast.success(t('cliConfig.copied'), {position: 'bottom-center'});
  }

  return (
    <DropdownMenuItem onClick={copyCliConfig}>
      {t('cliConfig.copy')}
    </DropdownMenuItem>
  );
}
