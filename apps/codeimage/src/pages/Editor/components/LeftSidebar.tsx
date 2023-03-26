import {Box, Button} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {createSignal} from 'solid-js';
import {ColorSwatchIcon} from '../../../components/Icons/ColorSwatch';
import {EditorForm} from '../../../components/PropertyEditor/EditorForm';
import {EditorSidebar} from '../../../components/PropertyEditor/EditorSidebar';
import {scaffoldVars} from '../../../components/Scaffold/Scaffold.css';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';
import {PresetSwitcher} from '../../../components/ThemeSwitcher/PresetSwitcher';

export function EditorLeftSidebar() {
  const [toggle, setToggle] = createSignal(false);

  return (
    <div style={{position: 'relative', display: 'flex'}}>
      <Sidebar>
        <EditorForm>
          <Box marginTop={3}>
            <Button
              variant={'solid'}
              theme={'secondary'}
              size={'xs'}
              block
              leftIcon={<ColorSwatchIcon />}
              onClick={() => setToggle(toggle => !toggle)}
            >
              Open presets
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
    </div>
  );
}
