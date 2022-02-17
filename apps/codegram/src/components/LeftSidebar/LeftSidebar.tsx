import * as styles from './LeftSidebar.css';
import {Text} from '../ui/Text/Text';
import {RangeField} from '../ui/RangeField/RangeField';
import {Show} from 'solid-js';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {ShadowField} from '../ShadowField/ShadowField';
import {ColorPicker} from '../ui/ColorPicker/ColorPicker';
import {useFrameState} from '../../state/frame';
import {useTerminalState} from '../../state/terminal';

export const FrameSidebar = () => {
  const frame = useFrameState();
  const terminal = useTerminalState();

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
        {/*<TextField*/}
        {/*  value={frame.radius}*/}
        {/*  onChange={frame.setRadius}*/}
        {/*  type="number"*/}
        {/*  size="xs"*/}
        {/*  min={0}*/}
        {/*  max={64}*/}
        {/*/>*/}
        <RangeField
          value={frame.radius}
          step={8}
          min={0}
          max={64}
          onChange={frame.setRadius}
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
            value={frame.padding}
            onChange={frame.setPadding}
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
            value={frame.autoWidth}
            onChange={frame.setAutoWidth}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </div>
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
            value={frame.visible}
            onChange={frame.setVisibility}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </div>
      </div>

      <Show when={frame.visible}>
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
              value={frame.opacity}
              min={0}
              disabled={!frame.visible}
              max={100}
              onChange={frame.setOpacity}
            />
          </div>
        </div>
      </Show>

      <Show when={frame.visible}>
        <div class={styles.panelRow}>
          <Text as="div" size={'sm'} class={styles.titleWrapper}>
            Color
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
            <ColorPicker
              onChange={frame.setBackground}
              value={frame.background ?? undefined}
            />
          </div>
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
            value={terminal.accentVisible}
            onChange={terminal.setAccentVisible}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </div>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Shadows
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
          <ShadowField value={frame.shadow} onChange={frame.setShadow} />
        </div>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Font
        </Text>
      </div>
    </div>
  );
};
