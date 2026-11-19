import {SettingsSearchField} from './SettingsSearchField';
import type {SettingsSearchProps} from './settings-search-props';

export default function SettingsSearch(props: SettingsSearchProps) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.query) {
      event.stopPropagation();
      props.onQuery('');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      props.onFocusSections();
    }
  }

  return (
    <div
      class={props.searchClass}
      ref={element => {
        element.addEventListener('keydown', handleKeyDown);
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
