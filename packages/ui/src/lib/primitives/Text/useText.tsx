import clsx from 'clsx';
import * as styles from './Text.css';
import {baseText} from './Text.css';

export interface UseTextProps {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

export const useText = ({size = 'base', weight = 'normal'}: UseTextProps) => {
  return clsx(baseText, styles.fontWeight[weight], styles.fontSize[size]);
};
