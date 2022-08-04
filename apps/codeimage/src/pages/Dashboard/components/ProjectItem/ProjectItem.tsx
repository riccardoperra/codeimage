import {ApiTypes} from '@codeimage/api/api-types';
import {LanguageDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {uiStore} from '@codeimage/store/ui';
import {
  Box,
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  HStack,
  MenuButton,
  Text,
} from '@codeimage/ui';
import {formatDistanceToNow} from '@core/helpers/date';
import {Item} from '@solid-aria/collection';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {Link} from 'solid-app-router';
import {For, Show, VoidProps} from 'solid-js';
import {DotVerticalIcon} from '../../../../components/Icons/DotVertical';
import {getDashboardState} from '../../dashboard.state';
import * as styles from './ProjectItem.css';

interface ProjectItemProps {
  item: ApiTypes.CreateProjectApi['response'];
}

export function ProjectItem(props: VoidProps<ProjectItemProps>) {
  const dashboard = getDashboardState()!;
  const locale = () => uiStore.locale;
  const createDialog = createStandaloneDialog();

  const date = () => {
    return formatDistanceToNow(locale(), props.item.createdAt);
  };

  const lastUpdateDate = () => {
    return formatDistanceToNow(locale(), props.item.updatedAt);
  };

  return (
    <li class={styles.item}>
      <Link class={styles.itemLink} href={`/${props.item.id}`} />
      <div>
        <div class={styles.itemTitle}>
          <Text size={'lg'}>{props.item.name}</Text>
        </div>

        <Text size={'xs'}>Created {date()}</Text>
        <Box as={'span'} marginX={'2'} display={'inlineBlock'}>
          /
        </Box>
        <Text size={'xs'}>Updated {lastUpdateDate()}</Text>

        <HStack spacing={'2'} marginTop={3} flexWrap={'wrap'}>
          <For each={props.item.editorTabs}>
            {editorTab => {
              const language: LanguageDefinition | null =
                SUPPORTED_LANGUAGES.find(tab =>
                  tab.icons.find(icon => icon.matcher.test(editorTab.tabName)),
                ) ?? null;

              return (
                <Show when={language}>
                  {language => (
                    <HStack spacing={'2'}>
                      <div
                        style={{
                          'border-radius': '50%',
                          'background-color': language.color,
                          height: '12px',
                          width: '12px',
                        }}
                      />
                      <Text size={'xs'}>{language.label}</Text>
                    </HStack>
                  )}
                </Show>
              );
            }}
          </For>
        </HStack>
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
