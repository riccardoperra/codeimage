import type {LanguageIconDefinition} from '@codeimage/config';
import {Loading, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX} from '@solidjs/web';
import type {FlowProps, ParentProps, Ref} from 'solid-js';
import {merge, Show, omit, Loading as LoadingBoundary} from 'solid-js';
import {TabIcon} from '../TabIcon/TabIcon';
import type {WindowStyle} from '../../WindowStyles/WindowStyles';
import * as modern from './WindowTabStyle.css';
import * as styles from './Tab.css';

export interface WindowTabProps {
  readonly appearance?: WindowStyle;
  readonly active: boolean;
  readonly index: number;
  readonly accentMode: boolean;
  readonly lite?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly tabIcon?: LanguageIconDefinition['content'];
  readonly content: JSX.Element;
  readonly rightContent?: JSX.Element;
}

export function WindowTab(
  props: ParentProps<WindowTabProps & JSX.IntrinsicElements['div']>,
) {
  const others = omit(
    props,
    'class',
    'ref',
    'style',
    'rightContent',
    'content',
    'appearance',
    'active',
    'index',
    'accentMode',
    'lite',
    'tabIcon',
  );

  return (
    <div
      data-watermark-obstacle
      data-active={String(props.active)}
      data-window-tab={props.appearance}
      data-host-index={props.index}
      data-lite={props.lite === undefined ? undefined : String(props.lite)}
      data-accent-visible={String(props.accentMode)}
      class={[
        props.appearance
          ? modern.tab
          : styles.tab({
              accent: props.accentMode,
              active: props.active,
              lite: props.lite,
            }),
        props.class,
      ]}
      ref={props.ref}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
      {...others}
    >
      <LoadingBoundary fallback={<Loading size={'sm'} />}>
        <Show when={props.appearance && props.appearance !== 'shell'}>
          <span class={modern.mark} />
        </Show>
        <Show when={!props.appearance && props.tabIcon} keyed>
          {icon => (
            <TabIcon delay={0} size={props.lite ? 'xs' : 'md'} content={icon} />
          )}
        </Show>
        <div class={props.appearance ? modern.text : styles.tabTextContent}>
          {props.content}
        </div>
      </LoadingBoundary>
      <Show when={props.rightContent}>{props.rightContent}</Show>
    </div>
  );
}

interface WindowTabContentTextProps {
  fallback?: JSX.Element;
}

export function WindowTabContentText(
  props: FlowProps<WindowTabContentTextProps>,
) {
  const propsWithDefaults = merge({fallback: 'Untitled'}, props);

  return (
    <Text size={'sm'} class={styles.fallbackText}>
      {props.children || propsWithDefaults.fallback}
    </Text>
  );
}
