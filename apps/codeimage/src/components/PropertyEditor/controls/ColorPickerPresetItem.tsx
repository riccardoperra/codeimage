import {backgroundColorVar, Box} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentProps} from 'solid-js';
import * as styles from './CustomColorPicker.css';
import {ColorPickerColorItemProps} from './CustomColorPicker.css';

type ColorPickerPresetItemProps = {
  title: string;
  color: string;
  onClick: (color: string) => void;
  active: boolean;
} & ColorPickerColorItemProps;

export function ColorPickerPresetItem(
  props: ParentProps<ColorPickerPresetItemProps>,
) {
  return (
    <Box
      class={styles.colorItem({
        active: props.active,
      })}
      title={props.title}
      style={assignInlineVars({
        [backgroundColorVar]: props.color,
      })}
      onClick={() => props.onClick(props.color)}
    />
  );
}
