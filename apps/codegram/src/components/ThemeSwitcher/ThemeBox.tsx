import * as styles from './ThemeSwitcher.css';
import {Component} from 'solid-js';
import {Text} from '../ui/Text/Text';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';

interface ThemeBoxProps {
  bg: string;
  onClick: (evt: MouseEvent) => void;
}

export const ThemeBox: Component<ThemeBoxProps> = props => {
  return (
    <div
      class={styles.themeBox}
      style={assignInlineVars({
        [backgroundColorVar]: props.bg,
      })}
      onClick={e => props.onClick(e)}
    >
      <div class={styles.themeBoxContent}>{props.children}</div>
      <div class={styles.themeBoxFooter}>
        <Text size={'sm'} weight={'semibold'}>
          One dark theme
        </Text>
      </div>
    </div>
  );
};
