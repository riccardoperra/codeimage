import type {JSX} from '@solidjs/web';
import {KitListbox, KitVirtualizedListbox} from './legacy-controls';

export interface ListboxProps<Option> {
  'aria-label'?: string;
  autoFocus?: boolean;
  bordered?: boolean;
  class?: string;
  disallowEmptySelection?: boolean;
  itemLabel: (item: Option) => JSX.Element;
  onChange: (values: Set<string>) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  options: Option[];
  optionTextValue: (item: Option) => string;
  optionValue: (item: Option) => string;
  selectionMode: 'single';
  shouldFocusWrap?: boolean;
  size?: 'xs' | 'sm' | 'md';
  theme?: 'primary' | 'neutral';
  value: string[];
}

type ListboxComponent = <Option>(props: ListboxProps<Option>) => JSX.Element;

export const Listbox = KitListbox as unknown as ListboxComponent;
export const VirtualizedListbox =
  KitVirtualizedListbox as unknown as ListboxComponent;
