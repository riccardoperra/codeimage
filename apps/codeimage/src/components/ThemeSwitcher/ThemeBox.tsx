import {CustomTheme} from '@codeimage/theme';
import {backgroundColorVar, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent} from 'solid-js';
import * as styles from './ThemeSwitcher.css';

interface ThemeBoxProps {
  theme: CustomTheme;
  selected?: boolean;
  onClick: (evt: MouseEvent) => void;
}

export const ThemeBox: ParentComponent<ThemeBoxProps> = props => {
  return (
    <div
      class={styles.themeBox}
      data-selected={props.selected}
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
