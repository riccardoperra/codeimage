import {adaptiveFullScreenHeight, Box} from '@codeimage/ui';
import {FrameSkeleton} from '../../../components/Frame/FrameSkeleton';
import {Canvas} from '../../../components/Scaffold/Canvas/Canvas';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';
import * as toolbarStyles from '../../../components/Toolbar/Toolbar.css';
import * as styles from '../App.css';

export function EditorPageSkeleton() {
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      class={adaptiveFullScreenHeight}
    >
      <div class={toolbarStyles.wrapper} />
      <div class={styles.wrapper}>
        <Sidebar position={'left'} />

        <Canvas>
          <Box
            height={'100%'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <FrameSkeleton />
          </Box>
        </Canvas>

        <Sidebar position={'right'} />
      </div>
    </Box>
  );
}
