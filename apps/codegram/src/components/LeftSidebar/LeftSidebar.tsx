import * as styles from './LeftSidebar.css';
import {Text} from '../ui/Text/Text';
import {TextField} from '../ui/TextField/TextField';
import {RangeField} from '../ui/RangeField/RangeField';
import {createMemo, createSignal, from} from 'solid-js';
import {frameState, updateRadius} from '../../state/frame.state';

export const FrameSidebar = () => {
  const state = from(frameState);

  const radius = createMemo(() => state().radius);

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
          step={4}
          min={0}
          max={64}
          onChange={updateRadius}
        />
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Padding
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Width
        </Text>
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
          Opacity
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Visible
        </Text>
      </div>

      <div class={styles.panelRow}>
        <Text as="div" size={'sm'} class={styles.titleWrapper}>
          Color
        </Text>
      </div>

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
