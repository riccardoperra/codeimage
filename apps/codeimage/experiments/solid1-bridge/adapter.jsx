import {createEffect, onCleanup, onMount} from 'solid-js';
import {mountProjectMenu} from 'virtual:codeimage-solid2-islands';

export function ProjectActionsMenu(props) {
  let target;
  const snapshot = () => ({
    renameLabel: props.renameLabel,
    duplicateLabel: props.duplicateLabel,
    deleteLabel: props.deleteLabel,
    onRename: props.onRename,
    onDuplicate: props.onDuplicate,
    onDelete: props.onDelete,
  });

  onMount(() => {
    const connection = mountProjectMenu(target, snapshot());
    createEffect(() => connection.update(snapshot()));
    onCleanup(connection.dispose);
  });

  return (
    <div
      ref={element => {
        target = element;
      }}
      data-solid2-project-menu
    />
  );
}
