import {getAssetsStore} from '@codeimage/store/assets/assets';
import {type Preset} from '@codeimage/store/presets/types';
import CustomEditorPreview from '../../CustomEditor/CustomEditorPreview';
import {DynamicTerminal} from '../../Terminal/DynamicTerminal/DynamicTerminal';
import {ThemeBox} from '../../ThemeSwitcher/ThemeBox';

interface PresetPreviewProps {
  code: string;
  data: Preset['data'];
}

export function PresetPreview(props: PresetPreviewProps) {
  const assetsStore = getAssetsStore();

  const background = () => {
    const value = props.data.frame.background;
    if (!value) return '#000';

    if (assetsStore.isAssetUrl(value)) {
      return assetsStore.getAssetImageBrowserUrl(value)() ?? '#000';
    }

    return value;
  };

  return (
    <ThemeBox
      showFooter={false}
      background={background()}
      onClick={() => void 0}
    >
      <DynamicTerminal
        lite={true}
        type={props.data.terminal.type}
        readonlyTab={true}
        showTab={true}
        shadow={props.data.terminal.shadow ?? null}
        background={props.data.terminal.background}
        accentVisible={props.data.terminal.accentVisible}
        textColor={props.data.terminal.textColor}
        showHeader={props.data.terminal.showHeader}
        borderType={props.data.terminal.borderType}
        showGlassReflection={props.data.terminal.showGlassReflection}
        showWatermark={false}
        opacity={props.data.terminal.opacity}
        alternativeTheme={props.data.terminal.alternativeTheme}
        themeId={props.data.editor.themeId}
      >
        <CustomEditorPreview
          themeId={props.data.editor.themeId}
          languageId={'typescript'}
          code={props.code}
        />
      </DynamicTerminal>
    </ThemeBox>
  );
}
