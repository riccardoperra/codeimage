import {Alert as KAlert} from '@kobalte/core';
import clsx from 'clsx';
import {JSXElement, Match, Show, splitProps, Switch} from 'solid-js';
import {CloseIcon} from '../../components/Icons/CloseIcon';
import {ExclamationAltIcon} from '../../components/Icons/Exclamation';
import {HintOutlineIcon} from '../../components/Icons/Hint';
import * as styles from './Alert.css';

type AlertProps = KAlert.AlertRootProps &
  styles.AlertVariants & {
    showIcon?: boolean;
    icon?: JSXElement;
  };

export function Alert(props: AlertProps) {
  const [local, others] = splitProps(props, [
    'theme',
    'children',
    'class',
    'icon',
    'showIcon',
  ]);

  const rootClass = () =>
    styles.alert({
      theme: props.theme,
      fluid: props.fluid,
    });

  return (
    <KAlert.Root class={clsx(local.class, rootClass())} {...others}>
      <Show when={local.showIcon}>
        <span class={styles.alertIcon}>
          {local.icon ? local.icon : <AlertIcon type={local.theme} />}
        </span>
      </Show>
      <span>{props.children}</span>
    </KAlert.Root>
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
