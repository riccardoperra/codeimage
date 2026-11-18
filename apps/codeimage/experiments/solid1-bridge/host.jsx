import {render} from '@solidjs/web';
import {createSignal} from 'solid-js';
import {ProjectActionsMenu} from '../../src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu';

export function mountProjectMenu(target, initialProps) {
  const [props, setProps] = createSignal(initialProps);
  const dispose = render(
    () => (
      <ProjectActionsMenu
        renameLabel={props().renameLabel}
        duplicateLabel={props().duplicateLabel}
        deleteLabel={props().deleteLabel}
        onRename={props().onRename}
        onDuplicate={props().onDuplicate}
        onDelete={props().onDelete}
      />
    ),
    target,
  );
  return {
    update(nextProps) {
      setProps(nextProps);
    },
    dispose,
  };
}
