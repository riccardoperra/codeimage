import clsx from 'clsx';
import {SvgIcon, SvgIconProps} from '../Icon/SvgIcon';
import * as styles from './LoadingCircle.css';

function LoadingCircleIcon(props: SvgIconProps) {
  return (
    <SvgIcon fill="none" viewBox="0 0 24 24" {...props}>
      <circle
        class={styles.circle}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class={styles.ring}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </SvgIcon>
  );
}

export function LoadingCircle(props: SvgIconProps) {
  const classes = () => clsx(props.class, styles.loadingIcon);

  return <LoadingCircleIcon {...props} class={classes()} />;
}
