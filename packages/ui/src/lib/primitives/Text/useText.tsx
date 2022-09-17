import clsx from 'clsx';
import {splitProps} from 'solid-js';
import * as styles from './Text.css';

export interface UseTextProps {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

export const useText = (props: UseTextProps) => {
  const [local] = splitProps(props, ['size', 'weight']);

  const sizeClass = () => {
    if (!local.size) {
      return styles.baseText;
    }
    return styles.fontSize[local.size] ?? undefined;
  };

  const weightClass = () => {
    if (!local.weight) return undefined;
    return styles.fontWeight[local.weight] ?? undefined;
  };

  const mergedClasses = () => clsx(weightClass(), sizeClass());

  return mergedClasses;
};
