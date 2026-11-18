export interface SettingsSearchFieldProps {
  label: string;
  query: string;
  size: 'sm' | 'md';
  iconClass: string;
  keyClass: string;
  onQuery(query: string): void;
  onInput(input: HTMLInputElement | undefined): void;
}

export interface SettingsSearchProps extends SettingsSearchFieldProps {
  searchClass: string;
  onFocusSections(): void;
}
