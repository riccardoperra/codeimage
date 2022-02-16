import * as styles from './ThemeSwitcher.css';
import {Component} from 'solid-js';
import {Text} from '../ui/Text/Text';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';
import {CustomTheme} from '@codegram/theme';

interface ThemeBoxProps {
  theme: CustomTheme;
  onClick: (evt: MouseEvent) => void;
}

export const ThemeBox: Component<ThemeBoxProps> = props => {
  return (
    <div
      class={styles.themeBox}
      style={assignInlineVars({
        [backgroundColorVar]: props.theme.properties.previewBackground,
      })}
      onClick={e => props.onClick(e)}
    >
      <div class={styles.themeBoxContent}>{props.children}</div>
      <div class={styles.themeBoxFooter}>
        <Text size={'sm'} weight={'semibold'}>
          {props.theme.properties.label}
        </Text>
      </div>
    </div>
  );
};
