import type * as ApiTypes from '@codeimage/api/api-types';
import {LanguageDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {getUiStore} from '@codeimage/store/ui';
import {backgroundColorVar, Box, HStack, Text, toast} from '@codeimage/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {highlight as _highlight} from '@core/directives/highlight';
import {formatDistanceToNow} from '@core/helpers/date';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {Link, useNavigate} from '@solidjs/router';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import {assignInlineVars} from '@vanilla-extract/dynamic';
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
  const uiStore = getUiStore();
  const locale = () => uiStore.get.locale;
  const openDialog = createControlledDialog();
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

  async function clone() {
    try {
      const result = await dashboard.cloneProject(props.item);
      if (!result) throw new Error('Error');
      toast.success(
        t('dashboard.projectCloneSuccess', {name: props.item.name}),
        {
          position: 'bottom-center',
        },
      );
      navigate(`/${result.id}`);
    } catch (e) {
      toast.error(t('dashboard.errorCreatingProject'));
    }
  }

  async function deleteConfirm() {
    const oldData = dashboard.data.latest ?? [];
    try {
      await dashboard?.deleteProject(props.item.id);
      toast.success(
        t('dashboard.projectDeleteSuccess', {name: props.item.name}),
        {
          position: 'bottom-center',
        },
      );
    } catch (e) {
      toast.error(t('dashboard.projectDeleteError'));
      dashboard.mutateData(oldData);
    }
  }

  function onRename() {
    openDialog(RenameContentDialog, () => ({
      title: t('dashboard.renameProject.confirmTitle'),
      message: t('dashboard.renameProject.confirmMessage'),
      initialValue: props.item.name,
      onConfirm: async name => {
        await dashboard.updateSnippetName(props.item.id, props.item.name, name);
      },
    }));
  }

  function onDelete() {
    openDialog(ConfirmDialog, {
      title: t('dashboard.deleteProject.confirmTitle'),
      message: t('dashboard.deleteProject.confirmMessage'),
      onConfirm: () => {
        deleteConfirm();
      },
      actionType: 'danger' as const,
    });
  }

  return (
    <li class={styles.item}>
      <Link class={styles.itemLink} href={`/${props.item.id}`} />
      <div class={styles.itemTitle}>
        <Text size={'lg'} as={'div'}>
          <span use:highlight={dashboard.search()}>{props.item.name}</span>
        </Text>

        <div>
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
                <DropdownMenuItem onClick={onRename}>
                  {t('dashboard.renameProject.dropdownLabel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clone}>
                  {t('dashboard.cloneProject.dropdownLabel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>
                  {t('dashboard.deleteProject.dropdownLabel')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>

      <div class={styles.projectLanguages}>
        <For each={languages()}>
          {language => {
            return (
              <Show when={language}>
                <HStack spacing={'2'}>
                  <div
                    class={styles.languageBadge}
                    style={assignInlineVars({
                      [backgroundColorVar]: language.color,
                    })}
                  />
                  <Text size={'xs'}>{language.label}</Text>
                </HStack>
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
