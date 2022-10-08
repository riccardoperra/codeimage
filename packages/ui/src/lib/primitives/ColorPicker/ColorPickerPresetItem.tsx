import {assignInlineVars} from '@vanilla-extract/dynamic';
import {PropsWithChildren} from 'solid-js';
import {backgroundColorVar} from '../../theme';
import {Box} from '../Box';
import * as styles from './ColorPicker.css';
import {ColorPickerColorItemProps} from './ColorPicker.css';

type ColorPickerPresetItemProps = {
  title: string;
  color: string;
  onClick: (color: string) => void;
  active: boolean;
} & ColorPickerColorItemProps;

export function ColorPickerPresetItem(
  props: PropsWithChildren<ColorPickerPresetItemProps>,
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
