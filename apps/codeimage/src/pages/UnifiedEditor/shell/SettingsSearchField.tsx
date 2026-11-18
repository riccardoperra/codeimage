import {TextField} from '@ui/legacy-controls';
import {createEffect, createSignal, onCleanup} from 'solid-js';
import {SearchIcon} from './icons';
import type {SettingsSearchFieldProps} from './settings-search-props';

export function SettingsSearchField(props: SettingsSearchFieldProps) {
  const [input, setInput] = createSignal<HTMLInputElement>();
  onCleanup(() => props.onInput(undefined));
  createEffect(
    () => [input(), props.label] as const,
    ([element, label]) => {
      if (element) element.setAttribute('aria-label', label);
    },
  );

  return (
    <>
      <span class={props.iconClass}>
        <SearchIcon size={16} />
      </span>
      <TextField
        size={props.size}
        placeholder={props.label}
        ref={input => {
          props.onInput(input);
          setInput(input);
        }}
        value={props.query}
        onChange={props.onQuery}
      />
      <kbd class={props.keyClass} aria-hidden="true">
        /
      </kbd>
    </>
  );
}
