import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {getFrameState} from '@codeimage/store/editor/frame';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {
  adaptiveFullScreenHeight,
  Box,
  Button,
  FlexField,
  HStack,
  PortalHost,
  SegmentedField,
} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {createSignal, lazy, Match, Show, Suspense, Switch} from 'solid-js';
import {BottomBar} from '../../components/BottomBar/BottomBar';
import {Footer} from '../../components/Footer/Footer';
import {FrameHandler} from '../../components/Frame/FrameHandler';
import {FrameSkeleton} from '../../components/Frame/FrameSkeleton';
import {ColorSwatchIcon} from '../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../components/Icons/SparklesIcon';
import {KeyboardShortcuts} from '../../components/KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from '../../components/PropertyEditor/EditorSidebar';
import {PanelDivider} from '../../components/PropertyEditor/PanelDivider';
import {SuspenseEditorItem} from '../../components/PropertyEditor/SuspenseEditorItem';
import {Canvas} from '../../components/Scaffold/Canvas/Canvas';
import {Sidebar} from '../../components/Scaffold/Sidebar/Sidebar';
import {PresetSwitcher} from '../../components/ThemeSwitcher/PresetSwitcher';
import {ThemeSwitcher} from '../../components/ThemeSwitcher/ThemeSwitcher';
import {ExportButton} from '../../components/Toolbar/ExportButton';
import {ExportInNewTabButton} from '../../components/Toolbar/ExportNewTabButton';
import {FrameToolbar} from '../../components/Toolbar/FrameToolbar';
import {ShareButton} from '../../components/Toolbar/ShareButton';
import {Toolbar} from '../../components/Toolbar/Toolbar';
import * as styles from './App.css';
import {EditorReadOnlyBanner} from './components/EditorReadOnlyBanner';

const ManagedFrame = lazy(() =>
  import('../../components/Frame/ManagedFrame').then(c => ({
    default: c.ManagedFrame,
  })),
);

export function App() {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const modality = useModality();
  const frameStore = getFrameState();
  const {readOnly, clone} = getEditorSyncAdapter()!;

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      class={adaptiveFullScreenHeight}
    >
      <Toolbar canvasRef={frameRef()} />
      <div class={styles.wrapper}>
        <Show when={modality === 'full' && !readOnly()}>
          <Sidebar position={'left'}>
            {() => {
              const [value, setValue] = createSignal<'styles' | 'preset'>(
                'styles',
              );

              return (
                <Box>
                  <Box padding={'3'}>
                    <FlexField size={'md'}>
                      <SegmentedField
                        items={[
                          {label: 'Styles', value: 'styles'},
                          {label: 'Presets', value: 'preset'},
                        ]}
                        value={value()}
                        onChange={setValue}
                      />

                      <PanelDivider />
                    </FlexField>
                  </Box>
                  <Switch>
                    <Match when={value() === 'styles'} keyed={false}>
                      <EditorSidebar />
                    </Match>
                    <Match when={value() === 'preset'} keyed={false}>
                      <PresetSwitcher orientation={'vertical'} />
                    </Match>
                  </Switch>
                </Box>
              );
            }}
          </Sidebar>
        </Show>

        <PortalHost ref={setPortalHostRef} />

        <Canvas>
          <SuspenseEditorItem
            fallback={
              <Box
                height={'100%'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <FrameSkeleton />
              </Box>
            }
          >
            <Show when={readOnly()}>
              <EditorReadOnlyBanner onClone={clone} />
            </Show>

            <Show when={!readOnly() && modality === 'full'}>
              <Box display={'flex'} paddingTop={3} paddingX={4}>
                <HStack spacing={'2'}>
                  <KeyboardShortcuts />
                </HStack>
              </Box>
            </Show>

            <Show when={modality === 'mobile'}>
              <Box class={styles.mobileActionToolbar}>
                <HStack spacing={'2'} justifyContent={'flexEnd'}>
                  <ShareButton showLabel={false} />
                  <Button
                    size={'xs'}
                    variant={'solid'}
                    theme={'secondary'}
                    leftIcon={<ColorSwatchIcon />}
                    onClick={() => dispatchRandomTheme()}
                  />
                  <Button
                    size={'xs'}
                    variant={'solid'}
                    theme={'secondary'}
                    leftIcon={<SparklesIcon />}
                    onClick={() => getActiveEditorStore().format()}
                  />
                  <ExportInNewTabButton canvasRef={frameRef()} />
                  <ExportButton canvasRef={frameRef()} />
                </HStack>
              </Box>
            </Show>

            <FrameHandler ref={setFrameRef} onScaleChange={frameStore.setScale}>
              <Suspense fallback={<FrameSkeleton />}>
                <ManagedFrame />
              </Suspense>
            </FrameHandler>

            <Show when={modality === 'full'} keyed={false}>
              <FrameToolbar frameRef={frameRef()} />
              <Footer />
            </Show>
          </SuspenseEditorItem>
        </Canvas>

        <Show when={!readOnly()}>
          <Show
            when={modality === 'full'}
            fallback={<BottomBar portalHostRef={portalHostRef()} />}
          >
            <Sidebar position={'right'}>
              <ThemeSwitcher orientation={'vertical'} />
            </Sidebar>
          </Show>
        </Show>
      </div>
    </Box>
  );
}

export default App;
