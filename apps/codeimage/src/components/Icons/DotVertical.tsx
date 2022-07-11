import {SvgIcon, SvgIconProps} from '@codeimage/ui';

export function DotVerticalIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </SvgIcon>
  );
}

export function DotHorizontalIocn(props: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}
