import {FeatureName} from '@codeimage/store/version/version.store';
import {Box, Text} from '@codeimage/ui';
import {FlowComponent, JSXElement, Show} from 'solid-js';
import {FeatureBadge} from '../FeatureBadge/FeatureBadge';
import * as styles from './EditorSidebar.css';
import {panelRowContent} from './EditorSidebar.css';

interface PanelRowProps {
  label?: JSXElement;
  feature?: FeatureName;
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
          <Box as={'span'} position={'relative'}>
            {props.label}
            <Show when={props.feature}>
              {feature => (
                <FeatureBadge untilSeenTimes={3} featureName={feature()} />
              )}
            </Show>
          </Box>
        </Text>
      </Show>
      {props.children}
    </div>
  );
};
