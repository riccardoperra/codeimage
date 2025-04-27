import {type PolymorphicProps} from '@kobalte/core';
import {
  Alert as KAlert,
  type AlertRootProps as KAlertRootProps,
} from '@kobalte/core/alert';
import clsx from 'clsx';
import {
  type JSXElement,
  Match,
  Show,
  splitProps,
  Switch,
  type ValidComponent,
} from 'solid-js';
import {CloseIcon} from '../../components/Icons/CloseIcon';
import {ExclamationAltIcon} from '../../components/Icons/Exclamation';
import {HintOutlineIcon} from '../../components/Icons/Hint';
import * as styles from './Alert.css';

type AlertProps<T extends ValidComponent = 'div'> = KAlertRootProps<T> &
  styles.AlertVariants & {
    showIcon?: boolean;
    icon?: JSXElement;
  };

export function Alert<T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, AlertProps>,
) {
  const [local, others] = splitProps(
    props as PolymorphicProps<'div', AlertProps>,
    ['theme', 'children', 'class', 'icon', 'showIcon'],
  );

  const rootClass = () =>
    styles.alert({
      theme: props.theme,
      fluid: props.fluid,
    });

  return (
    <KAlert class={clsx(local.class, rootClass())} {...others}>
      <Show when={local.showIcon}>
        <span class={styles.alertIcon}>
          {local.icon ? local.icon : <AlertIcon type={local.theme} />}
        </span>
      </Show>
      <span>{props.children}</span>
    </KAlert>
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
