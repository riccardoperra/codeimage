import {SvgIcon, SvgIconProps} from '@codeimage/ui';

export function FolderIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </SvgIcon>
  );
}

export function FolderOpenIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fill-rule="evenodd"
        d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
        clip-rule="evenodd"
      />
      <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
    </SvgIcon>
  );
}
