import clsx from 'clsx';
import * as styles from './Text.css';

export interface UseTextProps {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

export const useText = ({size = 'base', weight = 'normal'}: UseTextProps) => {
  return clsx(styles.fontWeight[weight], styles.fontSize[size]);
};
