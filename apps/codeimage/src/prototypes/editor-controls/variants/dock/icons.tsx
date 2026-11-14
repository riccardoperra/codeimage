import type {JSX} from 'solid-js';

function Icon(props: {children: JSX.Element; size?: number}) {
  return (
    <svg
      class="dock-icon"
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

export const SearchIcon = () => (
  <Icon>
    <circle cx="7" cy="7" r="4.25" />
    <path d="m10.25 10.25 3.25 3.25" />
  </Icon>
);

export const SlidersIcon = () => (
  <Icon>
    <path d="M2 4.5h7M12.5 4.5H14M2 11.5h1.5M7 11.5h7" />
    <circle cx="10.75" cy="4.5" r="1.75" />
    <circle cx="5.25" cy="11.5" r="1.75" />
  </Icon>
);

export const PaddingIcon = () => (
  <Icon>
    <rect x="1.75" y="1.75" width="12.5" height="12.5" rx="2.5" />
    <rect x="5" y="5" width="6" height="6" rx="1" />
  </Icon>
);

export const CodeIcon = () => (
  <Icon>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon size={12}>
    <path d="m3 8.5 3.25 3L13 4.5" />
  </Icon>
);
