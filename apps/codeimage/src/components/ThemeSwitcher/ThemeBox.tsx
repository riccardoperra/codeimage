import {backgroundColorVar, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {mergeProps, ParentComponent, Show} from 'solid-js';
import * as styles from './ThemeSwitcher.css';

interface ThemeBoxProps {
  selected?: boolean;
  onClick: (evt: MouseEvent) => void;
  showFooter?: boolean;
  footerLabel?: string;
  background: string;
}

export const ThemeBox: ParentComponent<ThemeBoxProps> = props => {
  const propsWithDefault = mergeProps({showFooter: true}, props);

  return (
    <div
      class={styles.themeBox}
      data-selected={propsWithDefault.selected}
      style={assignInlineVars({
        [backgroundColorVar]: props.background,
      })}
      onClick={e => propsWithDefault.onClick(e)}
    >
      <div
        class={styles.themeBoxSelectedOverlay}
        data-visible={propsWithDefault.selected}
      />
      <div class={styles.themeBoxContent}>{propsWithDefault.children}</div>
      <Show when={propsWithDefault.showFooter} keyed={false}>
        <div class={styles.themeBoxFooter}>
          <Text size={'sm'} weight={'semibold'}>
            {props.footerLabel}
          </Text>
        </div>
      </Show>
    </div>
  );
};
