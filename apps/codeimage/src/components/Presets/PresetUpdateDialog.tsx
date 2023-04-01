import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Preset} from '@codeimage/store/presets/types';
import {
  Box,
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  HStack,
  SvgIcon,
  Text,
} from '@codeimage/ui';
import {JSXElement, mergeProps, VoidProps} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import CustomEditorPreview from '../CustomEditor/CustomEditorPreview';
import {TerminalHost} from '../Terminal/TerminalHost';
import * as styles from '../ThemeSwitcher/PresetSwitcher.css';
import {ThemeBox} from '../ThemeSwitcher/ThemeBox';

interface PresetUpdateDialogProps {
  currentPreset: Preset['data'];
  onConfirm: () => void;
  onClose?: () => void;
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

  function PresetPreview(props: {data: Preset['data']}) {
    return (
      <ThemeBox
        showFooter={false}
        background={props.data.frame.background ?? '#000'}
        onClick={() => void 0}
      >
        <TerminalHost
          themeClass={styles.themeBoxTerminalHost}
          textColor={props.data.terminal.textColor}
          background={props.data.terminal.background}
          accentVisible={props.data.terminal.accentVisible}
          shadow={props.data.terminal.shadow}
          showTab={props.data.terminal.alternativeTheme}
          readonlyTab={true}
          showHeader={props.data.terminal.showHeader}
          showWatermark={false}
          showGlassReflection={props.data.terminal.showGlassReflection}
          opacity={100}
          themeId={props.data.editor.options.themeId}
          alternativeTheme={props.data.terminal.alternativeTheme}
        >
          <CustomEditorPreview
            themeId={props.data.editor.options.themeId}
            languageId={'typescript'}
            code={exampleCode}
          />
        </TerminalHost>
      </ThemeBox>
    );
  }

  return (
    <Dialog
      size={'md'}
      title={'Update preset'}
      onClose={() => props.onClose?.()}
      isOpen={true}
    >
      <DialogPanelContent>
        <Text>
          Confirm to update the selected preset to the current editor state.
        </Text>

        <HStack spacing={2} justifyContent={'center'} marginTop={6}>
          <div>
            {/*// TODO: Add in new component*/}
            <li class={styles.item} style={{opacity: 0.5}}>
              <PresetPreview data={props.currentPreset} />
              <Box display={'flex'} justifyContent={'center'} marginTop={4}>
                <Text weight={'semibold'}>OLD</Text>
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
              <PresetPreview data={currentEditorData()} />
              <Box display={'flex'} justifyContent={'center'} marginTop={4}>
                <Text weight={'semibold'}>NEW</Text>
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
            variant={'solid'}
            theme={'secondary'}
            onClick={() => propsWithDefault.onClose?.()}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'sm'}
            type="submit"
            theme={propsWithDefault.actionType}
            variant={'solid'}
            onClick={() => propsWithDefault.onConfirm()}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
