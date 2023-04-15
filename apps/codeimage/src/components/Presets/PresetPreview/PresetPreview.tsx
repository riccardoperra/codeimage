import {Preset} from '@codeimage/store/presets/types';
import CustomEditorPreview from '../../CustomEditor/CustomEditorPreview';
import {DynamicTerminal} from '../../Terminal/DynamicTerminal/DynamicTerminal';
import {ThemeBox} from '../../ThemeSwitcher/ThemeBox';

interface PresetPreviewProps {
  code: string;
  data: Preset['data'];
}

export function PresetPreview(props: PresetPreviewProps) {
  return (
    <ThemeBox
      showFooter={false}
      background={props.data.frame.background ?? '#000'}
      onClick={() => void 0}
    >
      <DynamicTerminal
        lite={true}
        type={props.data.terminal.type}
        readonlyTab={true}
        showTab={true}
        shadow={props.data.terminal.shadow}
        background={props.data.terminal.background}
        accentVisible={props.data.terminal.accentVisible}
        textColor={props.data.terminal.textColor}
        showHeader={props.data.terminal.showHeader}
        showGlassReflection={props.data.terminal.showGlassReflection}
        showWatermark={false}
        opacity={props.data.terminal.opacity}
        alternativeTheme={props.data.terminal.alternativeTheme}
        themeId={props.data.editor.options.themeId}
      >
        <CustomEditorPreview
          themeId={props.data.editor.options.themeId}
          languageId={'typescript'}
          code={props.code}
        />
      </DynamicTerminal>
    </ThemeBox>
  );
}
