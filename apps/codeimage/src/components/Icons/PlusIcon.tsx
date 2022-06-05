import {SvgIcon, SvgIconProps} from '@codeimage/ui';

export function PlusIcon(props: SvgIconProps) {
  return (
    <SvgIcon
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      {...props}
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </SvgIcon>
  );
}
