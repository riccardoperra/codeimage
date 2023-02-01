import clsx from 'clsx';
import {JSX, ParentProps, splitProps} from 'solid-js';
import {svgIcon, SvgIconProps as _SvgIconProps} from './SvgIcon.css';

export type SvgIconProps = _SvgIconProps &
  ParentProps<JSX.IntrinsicElements['svg']>;

export function SvgIcon(props: SvgIconProps): JSX.Element {
  const classes = () => clsx(svgIcon({size: props.size}), props.class);
  const [local, others] = splitProps(props, ['class', 'children', 'viewBox']);

  return (
    // eslint-disable-next-line solid/jsx-no-duplicate-props
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      class={classes()}
      viewBox={local.viewBox}
      // eslint-disable-next-line solid/no-innerhtml
      innerHTML={props.innerHTML ?? undefined}
      {...others}
    >
      {props.children}
    </svg>
  );
}
