import {Box, Text} from '@codeimage/ui';
import type {FlowComponent, JSXElement} from 'solid-js';
import {Show} from 'solid-js';
import * as styles from './EditorSidebar.css';
import {panelRowContent} from './EditorSidebar.css';

interface PanelRowProps {
  label?: JSXElement;
  labelAccessory?: JSXElement;
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
        <Show
          when={props.labelAccessory !== undefined}
          fallback={
            <Text
              as="label"
              for={props.for}
              size="xs"
              class={styles.titleWrapper}
            >
              <Box as="span" position="relative">
                {props.label}
              </Box>
            </Text>
          }
        >
          <span class={styles.titleWrapper}>
            <Text as="label" for={props.for} size={'xs'}>
              <Box as={'span'} position={'relative'}>
                {props.label}
              </Box>
            </Text>
            {props.labelAccessory}
          </span>
        </Show>
      </Show>
      {props.children}
    </div>
  );
};
