import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorInit';
import {uiStore} from '@codeimage/store/ui';
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
import {VoidProps} from 'solid-js';
import {DotVerticalIcon} from '../../../../components/Icons/DotVertical';
import {getDashboardState, WorkspaceItem} from '../../dashboard.state';
import * as styles from './ProjectItem.css';

interface ProjectItemProps {
  item: WorkspaceItem;
}

export function ProjectItem(props: VoidProps<ProjectItemProps>) {
  const dashboard = getDashboardState()!;
  const {setActiveWorkspace} = getEditorSyncAdapter();
  const locale = () => uiStore.locale;
  const createDialog = createStandaloneDialog();

  const date = () => {
    const rtf1 = new Intl.DateTimeFormat(locale(), {dateStyle: 'long'});
    return rtf1.format(new Date(props.item.created_at));
  };

  return (
    <li class={styles.item}>
      <Link
        class={styles.itemLink}
        href={`/${props.item.snippetId}`}
        onClick={() => setActiveWorkspace(props.item)}
      />
      <div>
        <div class={styles.itemTitle}>
          <Text size={'lg'}>{props.item.name}</Text>
        </div>

        <Text size={'xs'}>{date()}</Text>
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
                dashboard?.deleteProject(props.item);
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
