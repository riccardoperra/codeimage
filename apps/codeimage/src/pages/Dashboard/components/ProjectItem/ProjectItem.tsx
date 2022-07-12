import {
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  MenuButton,
  Text,
} from '@codeimage/ui';
import {Item} from '@solid-aria/collection';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {Link} from 'solid-app-router';
import {startTransition, VoidProps} from 'solid-js';
import {DotVerticalIcon} from '../../../../components/Icons/DotVertical';
import {WorkspaceItem} from '../../Dashboard';
import {getDashboardState} from '../../DashboardContext';
import * as styles from './ProjectItem.css';

interface ProjectItemProps {
  item: WorkspaceItem;
}

export function ProjectItem(props: VoidProps<ProjectItemProps>) {
  const {deleteProject} = getDashboardState();
  const createDialog = createStandaloneDialog();

  return (
    <li class={styles.item}>
      <Link
        state={props.item}
        href={`/${props.item.id}`}
        class={styles.itemLink}
      />
      <div>
        <div class={styles.itemTitle}>
          <Text size={'lg'}>{props.item.name}</Text>
        </div>
      </div>
      <DropdownMenuV2
        menuButton={
          <MenuButton
            as={Button}
            variant={'link'}
            theme={'secondary'}
            size={'xs'}
          >
            <DotVerticalIcon size={'sm'} />
          </MenuButton>
        }
        onAction={action => {
          if (action === 'delete') {
            createDialog(ConfirmDialog, state => ({
              title: 'Delete project',
              message: 'This action is not reversible.',
              onConfirm: () => {
                deleteProject(props.item);
                state.close();
              },
              actionType: 'danger',
            }));
          }
        }}
      >
        <Item key={'delete'}>Delete</Item>
      </DropdownMenuV2>
    </li>
  );
}
