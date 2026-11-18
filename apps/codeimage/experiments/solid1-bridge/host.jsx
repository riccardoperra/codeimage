import {render} from '@solidjs/web';
import {createSignal} from 'solid-js';
import {ProjectActionsMenu} from '../../src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu';

export function mountProjectMenu(target, initialProps) {
  const [props, setProps] = createSignal(initialProps);
  let pendingAction;

  function runMenuActionAfterClose() {
    queueMicrotask(() => {
      const action = pendingAction;
      pendingAction = undefined;
      action?.();
    });
  }

  const dispose = render(
    () => (
      <ProjectActionsMenu
        renameLabel={props().renameLabel}
        duplicateLabel={props().duplicateLabel}
        deleteLabel={props().deleteLabel}
        onRename={() => {
          pendingAction = props().onRename;
        }}
        onDuplicate={() => {
          pendingAction = props().onDuplicate;
        }}
        onDelete={() => {
          pendingAction = props().onDelete;
        }}
        onCloseAutoFocus={runMenuActionAfterClose}
      />
    ),
    target,
  );
  return {
    update(nextProps) {
      setProps(nextProps);
    },
    dispose() {
      pendingAction = undefined;
      dispose();
    },
  };
}

export {mountReadOnlyNotice} from './read-only-host';
