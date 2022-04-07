import {Component, Show} from 'solid-js';
import * as styles from './EditorSidebar.css';
import {panelRowContent} from './EditorSidebar.css';
import {Text} from '@codeimage/ui';
import {Box} from '@codeimage/ui';

interface PanelRowProps {
  label?: string;
  for: string;
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
        <Text
          as="label"
          for={props.for}
          size={'xs'}
          class={styles.titleWrapper}
        >
          {props.label}
        </Text>
      </Show>
      {props.children}
    </div>
  );
};
