import {Component, Show} from 'solid-js';
import * as styles from './EditorSidebar.css';
import {panelRowContent} from './EditorSidebar.css';
import {Text} from '../ui/Text/Text';
import {Box} from '../ui/Box/Box';

interface PanelRowProps {
  label?: string;
}

export const FullWidthPanelRow: Component = props => (
  <Box class={panelRowContent({threeColumn: true})}>{props.children}</Box>
);

export const TwoColumnPanelRow: Component = props => (
  <Box class={panelRowContent({twoColumn: true})}>{props.children}</Box>
);

export const PanelRow: Component<PanelRowProps> = props => {
  return (
    <div class={styles.panelRow}>
      <Show when={props.label}>
        <Text as="div" size={'xs'} class={styles.titleWrapper}>
          {props.label}
        </Text>
      </Show>
      {props.children}
    </div>
  );
};
