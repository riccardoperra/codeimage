import clsx from 'clsx';
import {sprinkles} from '../../theme/sprinkles.css';
import * as styles from './ShadowForm.css';
import {themeVars} from '../../theme/global.css';
import {Component} from 'solid-js';

interface ShadowFormProps {
  onChange: (shadow: string) => void;
}

export const ShadowForm: Component<ShadowFormProps> = props => {
  return (
    <div class={styles.wrapper}>
      <div
        onClick={() => props.onChange(themeVars.boxShadow.none)}
        class={clsx(styles.box, sprinkles({boxShadow: 'none'}))}
      />

      <div
        onClick={() => props.onChange(themeVars.boxShadow.default)}
        class={clsx(styles.box, sprinkles({boxShadow: 'default'}))}
      />

      <div
        onClick={() => props.onChange(themeVars.boxShadow.md)}
        class={clsx(styles.box, sprinkles({boxShadow: 'md'}))}
      />

      <div
        onClick={() => props.onChange(themeVars.boxShadow.lg)}
        class={clsx(styles.box, sprinkles({boxShadow: 'lg'}))}
      />

      <div
        onClick={() => props.onChange(themeVars.boxShadow.xl)}
        class={clsx(styles.box, sprinkles({boxShadow: 'xl'}))}
      />

      <div
        onClick={() => props.onChange(themeVars.boxShadow['2xl'])}
        class={clsx(styles.box, sprinkles({boxShadow: '2xl'}))}
      />
    </div>
  );
};
