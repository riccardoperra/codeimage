import {LanguageIconDefinition} from '@codeimage/config';
import {Loading, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  FlowProps,
  JSX,
  JSXElement,
  mergeProps,
  ParentProps,
  Ref,
  Show,
  Suspense,
} from 'solid-js';
import {TabIcon} from '../TabIcon/TabIcon';
import * as styles from './Tab.css';

export interface WindowTabProps {
  readonly active: boolean;
  readonly index: number;
  readonly accentMode: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly tabIcon?: LanguageIconDefinition['content'];
  readonly content: JSXElement;
  readonly rightContent?: JSXElement;
}

export function WindowTab(
  props: ParentProps<WindowTabProps & JSX.IntrinsicElements['div']>,
) {
  return (
    <div
      data-active={props.active}
      data-host-index={props.index}
      data-accent-visible={props.accentMode}
      class={styles.tab({
        accent: props.accentMode,
        active: props.active,
      })}
      ref={props.ref}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
    >
      <Suspense fallback={<Loading size={'sm'} />}>
        <Show when={props.tabIcon} keyed>
          {icon => <TabIcon content={icon} />}
        </Show>
        <div class={styles.tabTextContent}>{props.content}</div>
      </Suspense>
      <Show when={props.rightContent}>{props.rightContent}</Show>
    </div>
  );
}

interface WindowTabContentTextProps {
  fallback?: JSXElement;
}

export function WindowTabContentText(
  props: FlowProps<WindowTabContentTextProps>,
) {
  const propsWithDefaults = mergeProps({fallback: 'Untitled'}, props);

  return (
    <Text size={'sm'} class={styles.fallbackText}>
      {props.children || propsWithDefaults.fallback}
    </Text>
  );
}
