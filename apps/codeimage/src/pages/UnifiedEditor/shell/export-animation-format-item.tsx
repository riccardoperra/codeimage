import {ANIMATION_FORMATS, type AnimationFormat} from '@core/video/formats';
import {RadioGroup} from '@ui/RadioGroup/RadioGroup';
import * as styles from './export.css';

export function FormatItem(props: {
  format: AnimationFormat;
  disabled?: boolean;
}) {
  return (
    <RadioGroup.Item
      value={props.format}
      disabled={props.disabled}
      class={styles.videoFormatItem}
    >
      <RadioGroup.ItemInput />
      <RadioGroup.ItemControl class={styles.videoFormatRadio}>
        <RadioGroup.ItemIndicator class={styles.videoFormatIndicator} />
      </RadioGroup.ItemControl>
      <RadioGroup.ItemLabel>
        {ANIMATION_FORMATS[props.format].label}
      </RadioGroup.ItemLabel>
    </RadioGroup.Item>
  );
}
