import {AuthState} from '@codeimage/store/auth/auth';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {provideAppState} from '@codeimage/store/index';
import {Box, FlexField, HStack, LoadingCircle, Text} from '@codeimage/ui';
import {TextField} from '@codeui/kit';
import clickOutside from '@core/directives/clickOutside';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createEffect, createSignal, on, onMount, Show, untrack} from 'solid-js';
import {API} from '../../data-access/api';
import {useHotkey} from '../../hooks/use-hotkey';
import {PencilAlt} from '../Icons/Pencil';
import {SuspenseEditorItem} from '../PropertyEditor/SuspenseEditorItem';
import * as styles from './Toolbar.css';

void clickOutside;

export function ToolbarSnippetName() {
  const authState = provideAppState(AuthState);
  const [editing, setEditing] = createSignal(false);
  const loggedIn = () => authState.loggedIn();
  const {remoteSync, activeWorkspace, readOnly} = getEditorSyncAdapter()!;
  const [value, setValue] = createSignal(activeWorkspace()?.name || undefined);
  createEffect(
    on(activeWorkspace, workspace => setValue(workspace?.name || undefined)),
  );

  async function updateSnippetName(newName: string | undefined) {
    const $$activeWorkspace = activeWorkspace();
    if (!newName || !$$activeWorkspace || $$activeWorkspace.name === value()) {
      return;
    }
    setValue(newName);
    await API.project.updateSnippetName({
      params: {
        id: $$activeWorkspace.id,
      },
      body: {
        name: newName,
      },
    });
  }

  function toggleEdit() {
    if (untrack(loggedIn)) {
      setEditing(true);
    }
  }

  function submit() {
    setEditing(false);
    updateSnippetName(value());
  }

  return (
    <SuspenseEditorItem
      fallback={<SkeletonLine width={'120px'} height={'22px'} />}
    >
      <Box display={'flex'} alignItems={'center'} class={styles.toolbarSnippet}>
        <Show
          when={!readOnly()}
          fallback={<Text size={'sm'}>{value() ?? 'Untitled'}</Text>}
        >
          <Show
            fallback={
              <HStack
                spacing={'2'}
                alignItems={'center'}
                lineHeight={'normal'}
                class={styles.toolbarSnippetName}
                onClick={toggleEdit}
              >
                <Show when={remoteSync()}>
                  <LoadingCircle size={'sm'} />
                </Show>

                <Text size={'sm'}>{value() ?? 'Untitled'}</Text>
                <PencilAlt size={'sm'} />
              </HStack>
            }
            when={editing()}
          >
            <form use:clickOutside={submit} onSubmit={submit}>
              {(() => {
                let ref: HTMLInputElement | undefined;
                onMount(() => {
                  ref?.focus();
                  ref?.select();
                  useHotkey(ref!, {
                    Enter: () => {
                      setEditing(false);
                      updateSnippetName(value());
                    },
                    Escape: () => {
                      setEditing(false);
                      setValue(value());
                    },
                  });
                });

                return (
                  <FlexField size={'md'}>
                    <TextField
                      theme={'inline'}
                      slotClasses={{
                        input: styles.toolbarSnippetNameInput,
                      }}
                      ref={ref}
                      size={'sm'}
                      value={value()}
                      onChange={value => setValue(value)}
                    />
                  </FlexField>
                );
              })()}
            </form>
          </Show>
        </Show>
      </Box>
    </SuspenseEditorItem>
  );
}
