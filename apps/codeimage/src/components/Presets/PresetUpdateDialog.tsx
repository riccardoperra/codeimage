import {useI18n} from '@codeimage/locale';
import {Preset} from '@codeimage/store/presets/types';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  HStack,
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
  newPreset: Preset['data'];
  onConfirm: () => void;
  onClose?: () => void;
}

export function PresetUpdateDialog(
  props: VoidProps<PresetUpdateDialogProps>,
): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const propsWithDefault = mergeProps({actionType: 'primary'} as const, props);

  const exampleCode =
    'function Preview() {\n' +
    ' const [get, set] = \n' +
    '   createSignal(0);\n' +
    '}';

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
      onClose={props.onClose}
      isOpen={true}
    >
      <DialogPanelContent>
        <Text>
          Confirm to update the selected preset to the current editor state.
        </Text>

        <HStack spacing={2} justifyContent={'center'} marginTop={6}>
          <div>
            <li class={styles.item}>
              <PresetPreview data={props.currentPreset} />
            </li>
          </div>
          <div>
            <li class={styles.item}>
              <PresetPreview data={props.newPreset} />
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
            onClick={propsWithDefault.onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
