import type * as ApiTypes from '@codeimage/api/api-types';
import {LanguageDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {uiStore} from '@codeimage/store/ui';
import {
  Box,
  createStandaloneDialog,
  DropdownMenuV2,
  HStack,
  IconButton,
  MenuButton,
  Text,
} from '@codeimage/ui';
import {highlight as _highlight} from '@core/directives/highlight';
import {formatDistanceToNow} from '@core/helpers/date';
import {Item} from '@solid-aria/collection';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import {Link, useNavigate} from 'solid-app-router';
import {For, Show, VoidProps} from 'solid-js';
import {DotHorizontalIcon} from '../../../../components/Icons/DotVertical';
import {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';
import * as styles from './ProjectItem.css';

interface ProjectItemProps {
  item: ApiTypes.GetProjectByIdApi['response'];
}

const highlight = _highlight;

export function ProjectItem(props: VoidProps<ProjectItemProps>) {
  const dashboard = getDashboardState()!;
  const locale = () => uiStore.locale;
  const createDialog = createStandaloneDialog();
  const navigate = useNavigate();
  const [t] = useI18n<AppLocaleEntries>();

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
        <Text size={'lg'} as={'div'}>
          <span use:highlight={dashboard.search()}>{props.item.name}</span>
        </Text>

        <div>
          <DropdownMenuV2
            menuButton={<DotHorizontalIcon size={'sm'} />}
            onAction={(action: string | number) => {
              if (action === 'delete') {
                createDialog(ConfirmDialog, state => ({
                  title: t('dashboard.deleteProject.confirmTitle'),
                  message: t('dashboard.deleteProject.confirmMessage'),
                  onConfirm: () => {
                    dashboard?.deleteProject(props.item.id);
                    state.close();
                  },
                  actionType: 'danger' as const,
                }));
              }
              if (action === 'rename') {
                createDialog(RenameContentDialog, state => ({
                  title: t('dashboard.renameProject.confirmTitle'),
                  message: t('dashboard.renameProject.confirmMessage'),
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
              if (action === 'clone') {
                dashboard
                  .cloneProject(props.item)
                  ?.then(result => navigate(`/${result.id}`));
              }
            }}
          >
            <Item key={'rename'}>
              {t('dashboard.renameProject.dropdownLabel')}
            </Item>
            <Item key={'clone'}>
              {t('dashboard.cloneProject.dropdownLabel')}
            </Item>
            <Item key={'delete'}>
              {t('dashboard.deleteProject.dropdownLabel')}
            </Item>
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
        <Text size={'xs'}>
          {t('dashboard.created')} {date()}
        </Text>
        <Box as={'span'} marginX={2} display={'inlineBlock'}>
          /
        </Box>
        <Text size={'xs'}>
          {t('dashboard.updated')} {lastUpdateDate()}
        </Text>
      </div>
    </li>
  );
}
