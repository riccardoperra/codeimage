import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {DotHorizontalIcon} from '../../../../components/Icons/DotVertical';

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
        theme={'secondary'}
        size={'xs'}
        aria-label={'Menu'}
      >
        <DotHorizontalIcon size={'md'} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={props.onRename}>
            {props.renameLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onDuplicate}>
            {props.duplicateLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onDelete}>
            {props.deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
