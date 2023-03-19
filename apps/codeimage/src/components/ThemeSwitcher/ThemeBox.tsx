import {CustomTheme} from '@codeimage/highlight';
import {backgroundColorVar, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {mergeProps, ParentComponent, Show} from 'solid-js';
import * as styles from './ThemeSwitcher.css';

interface ThemeBoxProps {
  theme: CustomTheme;
  selected?: boolean;
  onClick: (evt: MouseEvent) => void;
  showFooter?: boolean;
}

export const ThemeBox: ParentComponent<ThemeBoxProps> = props => {
  const propsWithDefault = mergeProps({showFooter: true}, props);

  return (
    <div
      class={styles.themeBox}
      data-selected={propsWithDefault.selected}
      style={assignInlineVars({
        [backgroundColorVar]:
          propsWithDefault.theme.properties.previewBackground,
      })}
      onClick={e => propsWithDefault.onClick(e)}
    >
      <div class={styles.themeBoxContent}>{propsWithDefault.children}</div>
      <Show when={propsWithDefault.showFooter} keyed={false}>
        <div class={styles.themeBoxFooter}>
          <Text size={'sm'} weight={'semibold'}>
            {props.theme.properties.label}
          </Text>
        </div>
      </Show>
      <div
        class={styles.themeBoxSelectedOverlay}
        data-visible={propsWithDefault.selected}
      />
    </div>
  );
};
