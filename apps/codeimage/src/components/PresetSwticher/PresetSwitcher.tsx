import {useI18n} from '@codeimage/locale';
import {getPresetsStore} from '@codeimage/store/presets/presets';
import {getUiStore} from '@codeimage/store/ui';
import {
  Box,
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  HStack,
  IconButton,
  MenuButton,
  Text,
} from '@codeimage/ui';
import clsx from 'clsx';
import {For, lazy, ParentComponent, Suspense} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {PanelDivider} from '../PropertyEditor/PanelDivider';
import {NewPresetButton} from './dialog/NewPresetButton';
import {PresetPreview} from './PresetPreview';
import * as styles from './PresetSwitcher.css';
import {ThemeBoxSkeleton} from '../ThemeSwitcher/ThemeBoxSkeleton';
import {ThemeSwitcherVariant} from '../ThemeSwitcher/ThemeSwitcher.css';

type PresetSwitcherProps = {
  onClose: () => void;
};

export const PresetSwitcher: ParentComponent<
  PresetSwitcherProps & ThemeSwitcherVariant
> = props => {
  const presetsStore = getPresetsStore();
  const classes = () => clsx(styles.box);
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Box class={classes()}>
      <div class={styles.fixedTitle}>
        <Box
          display={'flex'}
          justifyContent={'spaceBetween'}
          alignItems={'center'}
        >
          <Text weight={'semibold'}>{t('presets.userPresets')}</Text>
          <HStack spacing={2}>
            <NewPresetButton />
            <Button
              size={'xs'}
              theme={'secondary'}
              variant={'solid'}
              onClick={() => props.onClose()}
            >
              <CloseIcon size={'md'} />
            </Button>
          </HStack>
        </Box>
        <PanelDivider />
      </div>

      <div class={styles.grid({orientation: props.orientation})}>
        <Suspense
          fallback={
            <>
              <ThemeBoxSkeleton />
            </>
          }
        >
          <For
            each={presetsStore.presets()}
            fallback={<p>non ci sono presets</p>}
          >
            {theme => <PresetPreview theme={theme} />}
          </For>
        </Suspense>
      </div>
    </Box>
  );
};
