import {Box} from '@codeimage/ui';
import {FrameSkeleton} from '../../../components/Frame/FrameSkeleton';
import {Canvas} from '../../../components/Scaffold/Canvas/Canvas';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';
import * as toolbarStyles from '../../../components/Toolbar/Toolbar.css';
import * as styles from '../App.css';

export function EditorPageSkeleton() {
  return (
    <>
      <div class={toolbarStyles.wrapper} />
      <div class={styles.wrapper}>
        <Sidebar position={'left'}>
          {/*<EditorForm>*/}
          {/*  <Box marginTop={6}>*/}
          {/*    <>*/}
          {/*      <SkeletonLine width={'33%'} height={'40px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'100px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'100px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'40px'} />*/}
          {/*      <SkeletonDivider height={'32px'} />*/}
          {/*    </>*/}
          {/*    <>*/}
          {/*      <SkeletonLine width={'33%'} height={'40px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'100px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'40px'} />*/}
          {/*      <SkeletonDivider height={'32px'} />*/}
          {/*    </>*/}
          {/*    <>*/}
          {/*      <SkeletonLine width={'33%'} height={'40px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'100px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*      <SkeletonLine width={'100%'} height={'100px'} />*/}
          {/*      <SkeletonDivider height={'16px'} />*/}
          {/*    </>*/}
          {/*  </Box>*/}
          {/*</EditorForm>*/}
        </Sidebar>

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

        <Sidebar position={'right'}>
          {/*<Box class={themeSwitcher.grid({orientation: 'vertical'})}>*/}
          {/*  <For each={new Array(8).fill(undefined)}>*/}
          {/*    {() => <ThemeBoxSkeleton />}*/}
          {/*  </For>*/}
          {/*</Box>*/}
        </Sidebar>
      </div>
    </>
  );
}
