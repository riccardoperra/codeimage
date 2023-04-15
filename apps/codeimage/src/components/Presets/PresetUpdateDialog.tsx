import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Preset} from '@codeimage/store/presets/types';
import {Box, HStack, SvgIcon, Text} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {Dialog, DialogPanelContent, DialogPanelFooter} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {JSXElement, mergeProps, VoidProps} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import CustomEditorPreview from '../CustomEditor/CustomEditorPreview';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import {PresetPreview} from './PresetPreview/PresetPreview';
import * as styles from './PresetSwitcher/PresetSwitcher.css';
import {ThemeBox} from '../ThemeSwitcher/ThemeBox';

interface PresetUpdateDialogProps extends ControlledDialogProps {
  currentPreset: Preset['data'];
  onConfirm: () => void;
}

export function PresetUpdateDialog(
  props: VoidProps<PresetUpdateDialogProps>,
): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const propsWithDefault = mergeProps({actionType: 'primary'} as const, props);

  const exampleCode = 'function Code() {\n' + ' console.log()\n' + '}';

  const currentEditorData = () => {
    return {
      frame: getFrameState().stateToPersist(),
      terminal: getTerminalState().stateToPersist(),
      editor: getRootEditorStore().stateToPersist(),
    };
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      size={'md'}
      title={t('presets.updatePreset.dialogTitle')}
    >
      <DialogPanelContent>
        <Text>{t('presets.updatePreset.dialogMessage')}</Text>

        <HStack spacing={2} justifyContent={'center'} marginTop={6}>
          <div>
            <li class={styles.item} style={{opacity: 0.5}}>
              <PresetPreview code={exampleCode} data={props.currentPreset} />
              <Box display={'flex'} justifyContent={'center'} marginTop={4}>
                <Text weight={'semibold'}>{t('presets.updatePreset.old')}</Text>
              </Box>
            </li>
          </div>
          <div>
            <SvgIcon
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              size={'lg'}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </SvgIcon>
          </div>
          <div>
            <li class={styles.item}>
              <PresetPreview code={exampleCode} data={currentEditorData()} />
              <Box display={'flex'} justifyContent={'center'} marginTop={4}>
                <Text weight={'semibold'}>{t('presets.updatePreset.new')}</Text>
              </Box>
            </li>
          </div>
        </HStack>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            block
            size={'sm'}
            type="button"
            theme={'secondary'}
            onClick={() => propsWithDefault.onOpenChange(false)}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'sm'}
            type="submit"
            theme={propsWithDefault.actionType}
            onClick={() => {
              propsWithDefault.onConfirm();
              propsWithDefault.onOpenChange(false);
            }}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
