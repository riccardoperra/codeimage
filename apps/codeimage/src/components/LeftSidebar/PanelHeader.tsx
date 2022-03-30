import * as styles from './EditorSidebar.css';
import {Text} from '../../ui/Text/Text';
import {Component} from 'solid-js';

interface PanelHeaderProps {
  label: string;
}

export const PanelHeader: Component<PanelHeaderProps> = props => {
  return (
    <div class={styles.panelHeader}>
      <Text size="sm" weight="semibold">
        {props.label}
      </Text>
    </div>
  );
};
