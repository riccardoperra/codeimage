import clsx from 'clsx';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {omit, Show} from 'solid-js';
import type {SvgIconProps as _SvgIconProps} from './SvgIcon.css';
import {svgIcon} from './SvgIcon.css';

export type SvgIconProps = _SvgIconProps &
  ParentProps<JSX.IntrinsicElements['svg']>;

export function SvgIcon(props: SvgIconProps): JSX.Element {
  const classes = () => clsx(svgIcon({size: props.size}), props.class);
  const others = omit(props, 'class', 'children', 'innerHTML', 'viewBox');
  const rawContent = () => ({innerHTML: props.innerHTML});

  return (
    <Show
      when={typeof props.innerHTML === 'string'}
      fallback={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          class={classes()}
          viewBox={props.viewBox}
          {...others}
        >
          {props.children}
        </svg>
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        class={classes()}
        viewBox={props.viewBox}
        {...others}
        {...rawContent()}
      />
    </Show>
  );
}
