import {ParentComponent, Show} from 'solid-js';
import {Dynamic, Portal} from 'solid-js/web';

type DropdownPortalProps = {
  isOpen: boolean;
  mount: HTMLElement | null;
};

export const DropdownPortal: ParentComponent<DropdownPortalProps> = props => {
  return (
    <Show when={props.isOpen}>
      <Dynamic
        component={props.mount ? Portal : 'div'}
        mount={props.mount as Node}
      >
        {props.children}
      </Dynamic>
    </Show>
  );
};
