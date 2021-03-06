import clsx from 'clsx';
import {JSX, mergeProps, ParentProps} from 'solid-js';
import {svgIcon, SvgIconProps as _SvgIconProps} from './SvgIcon.css';

export type SvgIconProps = _SvgIconProps &
  ParentProps<JSX.IntrinsicElements['svg']>;

export function SvgIcon(props: SvgIconProps): JSX.Element {
  const computedProps = mergeProps({size: 'md'} as _SvgIconProps, props);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      {...props}
      class={clsx(props.class, svgIcon({size: computedProps.size}))}
    >
      {props.children}
    </svg>
  );
}
