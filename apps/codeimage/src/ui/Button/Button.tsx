import * as styles from './Button.css';
import {ButtonProps as ShButtonProps} from 'solid-headless/dist/types/components/Button';
import {ValidConstructor} from 'solid-headless/dist/types/utils/dynamic-prop';
import {Button as UiButton} from '@codeimage/ui';

type ButtonProps<T extends ValidConstructor = 'button'> = ShButtonProps<T> &
  styles.ButtonVariants;

export const Button = UiButton;
