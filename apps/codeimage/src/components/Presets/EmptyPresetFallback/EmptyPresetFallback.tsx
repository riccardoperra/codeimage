import {useI18n} from '@codeimage/locale';
import {getPresetsStore} from '@codeimage/store/presets/presets';
import {Box, LoadingCircle, Text, VStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import {AppLocaleEntries} from '../../../i18n';
import * as styles from '../../../pages/Dashboard/components/ProjectList/ProjectList.css';
import {EmptyBox} from '../../Icons/EmptyBox';
import {PlusIcon} from '../../Icons/PlusIcon';

export function EmptyPresetFallback() {
  const openDialog = createControlledDialog();
  const [t] = useI18n<AppLocaleEntries>();
  const presetsStore = getPresetsStore();

  return (
    <div class={styles.fallbackContainer}>
      <EmptyBox />

      <VStack spacing={'2'} marginTop={6}>
        <Text size={'xl'} class={styles.fallbackTextTitle}>
          No presets
        </Text>
        <Box marginTop={5}>
          <Button
            size={'md'}
            theme={'primary'}
            leftIcon={
              presetsStore.actions.addNewPreset.loading ? (
                <LoadingCircle />
              ) : (
                <PlusIcon />
              )
            }
            onClick={() => {
              openDialog(RenameContentDialog, {
                title: t('presets.addPreset.confirmTitle'),
                message: t('presets.addPreset.confirmMessage'),
                onConfirm: async name => {
                  presetsStore.actions.addNewPreset({name});
                },
              });
            }}
          >
            Add new
          </Button>
        </Box>
      </VStack>
    </div>
  );
}
