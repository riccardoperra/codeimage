import clsx from 'clsx';
import {sprinkles} from '../../theme/sprinkles.css';
import * as styles from './ShadowForm.css';
import {updateBoxShadow} from '../../state/frame.state';
import {themeVars} from '../../theme/global.css';

export const ShadowForm = () => {
  return (
    <div class={styles.wrapper}>
      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow.none)}
        class={clsx(styles.box, sprinkles({boxShadow: 'none'}))}
      />

      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow.default)}
        class={clsx(styles.box, sprinkles({boxShadow: 'default'}))}
      />

      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow.md)}
        class={clsx(styles.box, sprinkles({boxShadow: 'md'}))}
      />

      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow.lg)}
        class={clsx(styles.box, sprinkles({boxShadow: 'lg'}))}
      />

      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow.xl)}
        class={clsx(styles.box, sprinkles({boxShadow: 'xl'}))}
      />

      <div
        onClick={() => updateBoxShadow(themeVars.boxShadow['2xl'])}
        class={clsx(styles.box, sprinkles({boxShadow: '2xl'}))}
      />
    </div>
  );
};
