import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {onCleanup} from 'solid-js';

export interface ProjectActionsMenuProps {
  renameLabel: string;
  duplicateLabel: string;
  deleteLabel: string;
  onRename(): void;
  onDuplicate(): void;
  onDelete(): void;
}

export function ProjectActionsMenu(props: ProjectActionsMenuProps) {
  let pendingAction: (() => void) | undefined;
  onCleanup(() => {
    pendingAction = undefined;
  });

  function runActionAfterClose() {
    queueMicrotask(() => {
      const action = pendingAction;
      pendingAction = undefined;
      action?.();
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        as={IconButton}
        theme={'secondary'}
        size={'xs'}
        aria-label={'Menu'}
      >
        <svg
          viewBox="0 0 24 24"
          width={16}
          height={16}
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx={6} cy={12} r={1.5} />
          <circle cx={12} cy={12} r={1.5} />
          <circle cx={18} cy={12} r={1.5} />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent onCloseAutoFocus={runActionAfterClose}>
          <DropdownMenuItem
            onClick={() => {
              pendingAction = props.onRename;
            }}
          >
            {props.renameLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              pendingAction = props.onDuplicate;
            }}
          >
            {props.duplicateLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              pendingAction = props.onDelete;
            }}
          >
            {props.deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
