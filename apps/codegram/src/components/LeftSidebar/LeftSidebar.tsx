import * as styles from './LeftSidebar.css';
import {Text} from '../ui/Text/Text';

export const FrameSidebar = () => {
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
