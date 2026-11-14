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

export const SunIcon: IconComponent = props => (
  <Icon size={props.size}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);

export const MoonIcon: IconComponent = props => (
  <Icon size={props.size}>
    <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />
  </Icon>
);
