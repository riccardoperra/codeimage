import {adaptiveFullScreenHeight, Box} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {Show} from 'solid-js';
import {FrameSkeleton} from '../../../components/Frame/FrameSkeleton';
import {Canvas} from '../../../components/Scaffold/Canvas/Canvas';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';
import * as toolbarStyles from '../../../components/Toolbar/Toolbar.css';
import * as styles from '../App.css';

export function EditorPageSkeleton() {
  const modality = useModality();
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      class={adaptiveFullScreenHeight}
    >
      <div class={toolbarStyles.wrapper} />
      <div class={styles.wrapper}>
        <Show when={modality === 'full'}>
          <Sidebar />
        </Show>

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

        <Show when={modality === 'full'}>
          <Sidebar />
        </Show>
      </div>
    </Box>
  );
}
