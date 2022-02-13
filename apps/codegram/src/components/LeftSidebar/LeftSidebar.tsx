import * as styles from './LeftSidebar.css';
import {Text} from '../ui/Text/Text';
import {TextField} from '../ui/TextField/TextField';
import {RangeField} from '../ui/RangeField/RangeField';
import {createMemo, from, Show} from 'solid-js';
import {
  frameState,
  updateAutoWidth,
  updateOpacity,
  updatePadding,
  updateRadius,
  updateVisibility,
} from '../../state/frame.state';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';

export const FrameSidebar = () => {
  const state = from(frameState);

  const radius = createMemo(() => state().radius);
  const opacity = createMemo(() => state().opacity);
  const autoWidth = createMemo(() => state().autoWidth);
  const padding = createMemo(() => state().padding);
  const visible = createMemo(() => state().visible);

  return (
    <div class={styles.sidebar}>
      <div class={styles.panelHeader}>
        <Text size="sm" weight="semibold">
          Frame
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Radius
        </Text>
        <TextField
          value={radius()}
          onChange={updateRadius}
          type="number"
          size="xs"
          min={0}
          max={64}
        />
        <RangeField
          value={radius()}
          step={8}
          min={0}
          max={64}
          onChange={updateRadius}
        />
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Padding
        </Text>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flex: '1 0 0',
            'grid-column': '2 / -1',
          }}
        >
          <SegmentedField
            size={'xs'}
            value={padding()}
            onChange={updatePadding}
            items={[
              {label: '16', value: 16},
              {label: '32', value: 32},
              {label: '64', value: 64},
              {label: '128', value: 128},
            ]}
          />
        </div>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Autowidth
        </Text>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flex: '1 0 0',
            'grid-column': '2 / -1',
          }}
        >
          <SegmentedField
            size={'xs'}
            value={autoWidth()}
            onChange={updateAutoWidth}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </div>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Color
        </Text>
      </div>

      <div class={styles.panelHeader}>
        <Text size="sm" weight="semibold">
          Background
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Visible
        </Text>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flex: '1 0 0',
            'grid-column': '2 / -1',
          }}
        >
          <SegmentedField
            size={'xs'}
            value={visible()}
            onChange={updateVisibility}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </div>
      </div>

      <Show when={visible()}>
        <div class={styles.panelRow}>
          <Text as="div" size={'sm'} class={styles.titleWrapper}>
            Opacity
          </Text>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              flex: '1 0 0',
              'grid-column': '2 / -1',
            }}
          >
            <RangeField
              value={opacity()}
              min={0}
              disabled={!visible()}
              max={100}
              onChange={updateOpacity}
            />
          </div>
        </div>
      </Show>

      <Show when={visible()}>
        <div class={styles.panelRow}>
          <Text as="div" size={'sm'} class={styles.titleWrapper}>
            Color
          </Text>
        </div>
      </Show>

      {/*{ Terminal }*/}

      <div class={styles.panelHeader}>
        <Text size="sm" weight="semibold">
          Terminal
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Tab accent
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Extension
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Shadows
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Font
        </Text>
      </div>
    </div>
  );
};
