import clsx from 'clsx';
import type {Element as JSXElement} from 'solid-js';
import type {JSX} from '@solidjs/web';
import {Match, Show, Switch, omit} from 'solid-js';
import {CloseIcon} from '../../components/Icons/CloseIcon';
import {ExclamationAltIcon} from '../../components/Icons/Exclamation';
import {HintOutlineIcon} from '../../components/Icons/Hint';
import * as styles from './Alert.css';

type AlertProps = JSX.HTMLAttributes<HTMLDivElement> &
  styles.AlertVariants & {
    showIcon?: boolean;
    icon?: JSXElement;
  };

export function Alert(props: AlertProps) {
  const others = omit(
    props,
    'theme',
    'fluid',
    'children',
    'class',
    'icon',
    'showIcon',
  );

  const rootClass = () =>
    styles.alert({
      theme: props.theme,
      fluid: props.fluid,
    });

  return (
    <div role="alert" class={clsx(props.class, rootClass())} {...others}>
      <Show when={props.showIcon}>
        <span class={styles.alertIcon}>
          {props.icon ? props.icon : <AlertIcon type={props.theme} />}
        </span>
      </Show>
      <span>{props.children}</span>
    </div>
  );
}

type AlertIconProps = {type: AlertProps['theme']};
function AlertIcon(props: AlertIconProps) {
  return (
    <Switch>
      <Match when={props.type === 'info'}>
        <HintOutlineIcon />
      </Match>
      <Match when={props.type === 'warning'}>
        <ExclamationAltIcon size={'lg'} />
      </Match>
      <Match when={props.type === 'critical'}>
        <CloseIcon size={'lg'} />
      </Match>
    </Switch>
  );
}
