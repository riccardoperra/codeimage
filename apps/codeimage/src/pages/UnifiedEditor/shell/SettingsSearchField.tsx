import {TextField} from '@codeui/kit';
import {onCleanup} from 'solid-js';
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
        aria-label={props.label}
        placeholder={props.label}
        ref={props.onInput}
        value={props.query}
        onChange={props.onQuery}
      />
      <kbd class={props.keyClass} aria-hidden="true">
        /
      </kbd>
    </>
  );
}
