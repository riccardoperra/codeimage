import clsx from 'clsx';

import * as styles from './Text.css';

export interface UseTextProps {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

export const useText = (props: UseTextProps) => {
  const sizeClass = () => {
    if (!props.size) {
      return styles.baseText;
    }
    return styles.fontSize[props.size] ?? undefined;
  };

  const weightClass = () => {
    if (!props.weight) return undefined;
    return styles.fontWeight[props.weight] ?? undefined;
  };

  const mergedClasses = () => clsx(weightClass(), sizeClass());

  return mergedClasses;
};
