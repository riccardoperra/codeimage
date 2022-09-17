import clsx from 'clsx';
import {JSX, ParentProps} from 'solid-js';
import {svgIcon, SvgIconProps as _SvgIconProps} from './SvgIcon.css';

export type SvgIconProps = _SvgIconProps &
  ParentProps<JSX.IntrinsicElements['svg']>;

export function SvgIcon(props: SvgIconProps): JSX.Element {
  const classes = () => clsx(svgIcon({size: props.size}), props.class);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      {...props}
      class={classes()}
    >
      {props.children}
    </svg>
  );
}
