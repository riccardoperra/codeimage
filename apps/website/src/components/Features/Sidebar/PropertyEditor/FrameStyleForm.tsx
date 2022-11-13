import {SegmentedField} from '@codeimage/ui';
import {createRoot, ParentComponent, Show} from 'solid-js';
import {createStore} from 'solid-js/store';
import {CustomColorPicker} from './controls/CustomColorPicker';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';

export interface FrameState {
  background: string | null;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
}

export function getInitialFrameState(): FrameState {
  return {
    // lazy initialization
    background: null,
    padding: 64,
    radius: 24,
    visible: true,
    opacity: 100,
    autoWidth: false,
    scale: 1,
  };
}

export function createFrameState() {
  const [store, setStore] = createStore<FrameState>(getInitialFrameState());

  return {
    store,
    setStore,
    setBackground: (background: string) => setStore('background', background),
    setOpacity: (opacity: number) => setStore('opacity', opacity),
    setPadding: (padding: number) => setStore('padding', padding),
    setRadius: (radius: number) => setStore('radius', radius),
    setScale: (scale: number) => setStore('scale', scale),
    setAutoWidth: (autoWidth: boolean) => setStore('autoWidth', autoWidth),
    setVisibility: (visibility: boolean) => setStore('visible', visibility),
    toggleVisibility: () => setStore('visible', visible => !visible),
    setNextPadding() {
      const availablePadding = [0, 16, 32, 64];
      setStore('padding', padding => {
        const currentIndex = [0, 16, 32, 64].indexOf(padding);
        const next = (currentIndex + 1) % availablePadding.length;
        return availablePadding[next];
      });
    },
  };
}

const state = createRoot(createFrameState);

export function getFrameState() {
  return state;
}

export const FrameStyleForm: ParentComponent = () => {
  const editorPadding = [16, 32, 64, 128];
  const frame = getFrameState();

  return (
    <>
      <PanelHeader label={'Frame'} />

      <PanelRow for={'paddingField'} label={'Padding'}>
        <TwoColumnPanelRow>
          <SegmentedField
            id={'paddingField'}
            size={'xs'}
            value={frame.store.padding}
            onChange={frame.setPadding}
            items={editorPadding.map(padding => ({
              label: padding.toString(),
              value: padding,
            }))}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.store.visible}>
        <PanelRow for={'colorField'} label={'Color'}>
          <TwoColumnPanelRow>
            <CustomColorPicker
              title={'Color'}
              onChange={color => frame.setBackground(color)}
              value={frame.store.background ?? ''}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
};
