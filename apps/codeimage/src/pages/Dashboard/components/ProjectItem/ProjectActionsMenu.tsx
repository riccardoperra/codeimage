import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@ui/DropdownMenu';
import {IconButton} from '@codeui/kit';

export interface ProjectActionsMenuProps {
  renameLabel: string;
  duplicateLabel: string;
  deleteLabel: string;
  onRename(): void;
  onDuplicate(): void;
  onDelete(): void;
}

export function ProjectActionsMenu(props: ProjectActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={IconButton}
        variant="secondary"
        size="xs"
        aria-label="Menu"
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
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => props.onRename()}>
            {props.renameLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => props.onDuplicate()}>
            {props.duplicateLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => props.onDelete()}>
            {props.deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
