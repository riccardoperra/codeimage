import type * as ApiTypes from '@codeimage/api/api-types';
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
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import {Link} from 'solid-app-router';
import {For, Show, VoidProps} from 'solid-js';
import {DotHorizontalIocn} from '../../../../components/Icons/DotVertical';
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
    return formatDistanceToNow(locale(), props.item.createdAt as string);
  };

  const lastUpdateDate = () => {
    return formatDistanceToNow(locale(), props.item.updatedAt as string);
  };

  const languages = (): LanguageDefinition[] => {
    return props.item.editorTabs.reduce<LanguageDefinition[]>(
      (acc, editorTab) => {
        const language = SUPPORTED_LANGUAGES.find(tab =>
          tab.icons.find(icon => icon.matcher.test(editorTab.tabName ?? '')),
        );

        return language && !acc.find(({id}) => language.id === id)
          ? [...acc, language]
          : acc;
      },
      [],
    );
  };

  return (
    <li class={styles.item}>
      <Link class={styles.itemLink} href={`/${props.item.id}`} />
      <div class={styles.itemTitle}>
        <Text size={'lg'}>{props.item.name}</Text>

        <div>
          <DropdownMenuV2
            menuButton={
              <MenuButton
                as={Button}
                variant={'solid'}
                theme={'secondary'}
                size={'xs'}
                style={{width: '30px', height: '30px'}}
              >
                <DotHorizontalIocn size={'sm'} />
              </MenuButton>
            }
            onAction={(action: string | number) => {
              if (action === 'delete') {
                createDialog(ConfirmDialog, state => ({
                  title: 'Delete project',
                  message: 'This action is not reversible.',
                  onConfirm: () => {
                    dashboard?.deleteProject(props.item.id);
                    state.close();
                  },
                  actionType: 'danger' as const,
                }));
              }
              if (action === 'rename') {
                createDialog(RenameContentDialog, state => ({
                  title: 'Rename project',
                  message: 'Enter a new name for the project.',
                  initialValue: props.item.name,
                  onConfirm: async name => {
                    state.close();
                    await dashboard.updateSnippetName(
                      props.item.id,
                      props.item.name,
                      name,
                    );
                  },
                }));
              }
            }}
          >
            <Item key={'rename'}>Rename</Item>
            <Item key={'delete'}>Delete</Item>
          </DropdownMenuV2>
        </div>
      </div>

      <div class={styles.projectLanguages}>
        <For each={languages()}>
          {language => {
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
      </div>

      <div class={styles.projectInfo}>
        <Text size={'xs'}>Created {date()}</Text>
        <Box as={'span'} marginX={2} display={'inlineBlock'}>
          /
        </Box>
        <Text size={'xs'}>Updated {lastUpdateDate()}</Text>
      </div>
    </li>
  );
}
