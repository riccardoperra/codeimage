import {JSX, mergeProps, PropsWithChildren} from 'solid-js';
import {svgIcon, SvgIconProps as _SvgIconProps} from './SvgIcon.css';
import clsx from 'clsx';

export type SvgIconProps = _SvgIconProps &
  PropsWithChildren<JSX.IntrinsicElements['svg']>;

export function SvgIcon(props: SvgIconProps): JSX.Element {
  const computedProps = mergeProps({size: 'md'}, props);

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
