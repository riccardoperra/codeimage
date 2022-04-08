import {SvgIcon, SvgIconProps} from '@codeimage/ui';

export function EmptyCircle(props: SvgIconProps) {
  return (
    <SvgIcon
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8 01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </SvgIcon>
  );
}
