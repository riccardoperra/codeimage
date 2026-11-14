import type {JSX} from 'solid-js';

function Icon(props: {children: JSX.Element; size?: number}) {
  return (
    <svg
      width={props.size ?? 20}
      height={props.size ?? 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

export type IconComponent = (props: {size?: number}) => JSX.Element;

export const ThemesIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M12 2.75c-5.1 0-9.25 4.15-9.25 9.25s4.15 9.25 9.25 9.25c.86 0 1.5-.69 1.5-1.56 0-.4-.16-.77-.4-1.04-.27-.27-.41-.6-.41-1.04 0-.86.69-1.54 1.54-1.54h1.85c2.82 0 5.14-2.31 5.14-5.13 0-4.46-4.17-8.19-9.23-8.19z" />
    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
    <circle cx="9.5" cy="7" r="1" fill="currentColor" />
    <circle cx="14.5" cy="7" r="1" fill="currentColor" />
    <circle cx="17" cy="11" r="1" fill="currentColor" />
  </Icon>
);

export const FrameIcon: IconComponent = props => (
  <Icon size={props.size}>
    <rect x="3" y="3" width="18" height="18" rx="3.5" />
    <rect x="7.5" y="8" width="9" height="8" rx="1.5" />
  </Icon>
);

export const WindowIcon: IconComponent = props => (
  <Icon size={props.size}>
    <rect x="2.75" y="4" width="18.5" height="16" rx="2.5" />
    <path d="M2.75 9h18.5" />
    <circle cx="6" cy="6.5" r=".6" fill="currentColor" />
    <circle cx="8.5" cy="6.5" r=".6" fill="currentColor" />
    <circle cx="11" cy="6.5" r=".6" fill="currentColor" />
  </Icon>
);

export const CodeIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="m17.5 16.5 4-4.5-4-4.5" />
    <path d="m6.5 7.5-4 4.5 4 4.5" />
    <path d="m14 4.5-4 15" />
  </Icon>
);

export const PresetsIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M18.5 21 12 17.25 5.5 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2z" />
  </Icon>
);

export const ExportIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M20.5 15v3.5a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V15" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M12 15V3" />
  </Icon>
);

export const CollapseIcon: IconComponent = props => (
  <Icon size={props.size}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </Icon>
);

export const CloseIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

export const ShuffleIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M2.5 18h1.6c1.3 0 2.5-.6 3.3-1.7l6.2-8.6c.8-1.1 2-1.7 3.3-1.7h4.6" />
    <path d="m18.5 3 3 3-3 3" />
    <path d="M2.5 6h1.8c1.5 0 2.9.9 3.6 2.2" />
    <path d="M21.5 18h-4.6c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
    <path d="m18.5 15 3 3-3 3" />
  </Icon>
);

export const SearchIcon: IconComponent = props => (
  <Icon size={props.size}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.5 20.5-4.5-4.5" />
  </Icon>
);

export const CheckIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const ChevronIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="m7 10 5 5 5-5" />
  </Icon>
);

export const SparklesIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M10 3.5 11.6 8l4.4 1.6-4.4 1.6L10 15.5l-1.6-4.3L4 9.6 8.4 8z" />
    <path d="M18 14v6" />
    <path d="M15 17h6" />
  </Icon>
);

export const CopyIcon: IconComponent = props => (
  <Icon size={props.size}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M4.5 15.5V6a2 2 0 0 1 2-2h9.5" />
  </Icon>
);

export const OpenIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M14.5 3.5h6v6" />
    <path d="M10 14 20.5 3.5" />
    <path d="M18.5 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h5.5" />
  </Icon>
);

export const ShareIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M4.5 12v7a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7" />
    <path d="m16 6.5-4-4-4 4" />
    <path d="M12 2.5v12.5" />
  </Icon>
);
