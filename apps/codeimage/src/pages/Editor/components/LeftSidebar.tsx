import {useI18n} from '@codeimage/locale';
import {Box} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {Motion} from '@motionone/solid';
import {createSignal} from 'solid-js';
import {ColorSwatchIcon} from '../../../components/Icons/ColorSwatch';
import {EditorForm} from '../../../components/PropertyEditor/EditorForm';
import {EditorSidebar} from '../../../components/PropertyEditor/EditorSidebar';
import {scaffoldVars} from '../../../components/Scaffold/Scaffold.css';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';
import {PresetSwitcher} from '../../../components/Presets/PresetSwitcher/PresetSwitcher';
import {type AppLocaleEntries} from '../../../i18n';

export function EditorLeftSidebar() {
  const [toggle, setToggle] = createSignal(false);
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <>
      <Sidebar>
        <EditorForm>
          <Box marginTop={3}>
            <Button
              theme={'secondary'}
              block
              size={'xs'}
              leftIcon={<ColorSwatchIcon />}
              onClick={() => setToggle(toggle => !toggle)}
            >
              {t('presets.openPreset.label')}
            </Button>
          </Box>
          <EditorSidebar />
        </EditorForm>
      </Sidebar>
      <Motion.div
        style={{
          'margin-left': `calc(${scaffoldVars.panelWidth} * -1)`,
          opacity: 0,
        }}
        animate={
          toggle()
            ? {
                marginLeft: 0,
                opacity: 1,
              }
            : {
                marginLeft: `calc(${scaffoldVars.panelWidth} * -1)`,
                opacity: 0,
              }
        }
      >
        <Sidebar position={'right'}>
          <EditorForm>
            <PresetSwitcher
              onClose={() => setToggle(toggle => !toggle)}
              orientation={'vertical'}
            />
          </EditorForm>
        </Sidebar>
      </Motion.div>
    </>
  );
}
