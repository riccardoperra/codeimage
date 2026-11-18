import {TextField} from '@codeui/kit';
import {createEffect, onCleanup} from 'solid-js';
import {SearchIcon} from './icons';
import type {SettingsSearchFieldProps} from './settings-search-props';

export function SettingsSearchField(props: SettingsSearchFieldProps) {
  onCleanup(() => props.onInput(undefined));

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
          createEffect(() => input.setAttribute('aria-label', props.label));
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
