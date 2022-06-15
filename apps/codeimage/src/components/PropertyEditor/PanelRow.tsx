import {Box, Text} from '@codeimage/ui';
import {FlowComponent, Show} from 'solid-js';
import * as styles from './EditorSidebar.css';
import {panelRowContent} from './EditorSidebar.css';

interface PanelRowProps {
  label?: string;
  for: string;
}

export const FullWidthPanelRow: FlowComponent = props => (
  <Box class={panelRowContent({threeColumn: true})}>{props.children}</Box>
);

export const TwoColumnPanelRow: FlowComponent = props => (
  <Box class={panelRowContent({twoColumn: true})}>{props.children}</Box>
);

export const PanelRow: FlowComponent<PanelRowProps> = props => {
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
