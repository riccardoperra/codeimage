import {useI18n} from '@codeimage/locale';
import {getPresetsStore} from '@codeimage/store/presets/presets';
import {Button, createStandaloneDialog} from '@codeimage/ui';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import {AppLocaleEntries} from '../../../i18n';

export const NewPresetButton = () => {
  const createDialog = createStandaloneDialog();
  const presetsStore = getPresetsStore();
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Button
      size={'xs'}
      theme={'primary'}
      variant={'solid'}
      onClick={() => {
        createDialog(RenameContentDialog, state => ({
          title: t('dashboard.renameProject.confirmTitle'),
          message: t('dashboard.renameProject.confirmMessage'),
          onConfirm: async name => {
            await presetsStore.actions.addNewPreset(name);
            state.close();
          },
        }));
      }}
    >
      Add new
    </Button>
  );
};
