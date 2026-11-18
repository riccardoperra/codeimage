import {onSettled} from 'solid-js';
import {SettingsSearchField} from '../../src/pages/UnifiedEditor/shell/SettingsSearchField';
import type {SettingsSearchProps} from '../../src/pages/UnifiedEditor/shell/settings-search-props';
import {createSolid2Mount} from './create-solid2-mount';

function SettingsSearch(props: SettingsSearchProps) {
  let container: HTMLDivElement | undefined;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.query) {
      event.stopPropagation();
      props.onQuery('');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      props.onFocusSections();
    }
  }

  onSettled(() => {
    const target = container;
    if (!target) return;
    const listener = new AbortController();
    target.addEventListener('keydown', handleKeyDown, {
      signal: listener.signal,
    });
    return () => listener.abort();
  });

  return (
    <div
      class={props.searchClass}
      ref={element => {
        container = element;
      }}
    >
      <SettingsSearchField
        label={props.label}
        query={props.query}
        size={props.size}
        iconClass={props.iconClass}
        keyClass={props.keyClass}
        onQuery={props.onQuery}
        onInput={props.onInput}
      />
    </div>
  );
}

export const mountSettingsSearch = createSolid2Mount(SettingsSearch);
