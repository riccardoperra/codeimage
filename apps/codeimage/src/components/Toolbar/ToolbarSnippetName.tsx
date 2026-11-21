import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {Box, FlexField, HStack, LoadingCircle, Text} from '@codeimage/ui';
import {TextField} from '@codeui/kit';
import clickOutside from '@core/directives/clickOutside';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createEffect, createSignal, Show, untrack} from 'solid-js';
import {API} from '../../data-access/api';
import {PencilAlt} from '../Icons/Pencil';
import {SuspenseEditorItem} from '../PropertyEditor/SuspenseEditorItem';
import * as styles from './Toolbar.css';

export function ToolbarSnippetName() {
  const [editing, setEditing] = createSignal(false);
  const [form, setForm] = createSignal<HTMLFormElement>();
  const [input, setInput] = createSignal<HTMLInputElement>();
  const loggedIn = () => getAuth0State().loggedIn();
  const {remoteSync, activeWorkspace, readOnly} = getEditorSyncAdapter()!;
  const [value, setValue] = createSignal(activeWorkspace()?.name || undefined);
  createEffect(activeWorkspace, workspace => {
    setValue(workspace?.name || undefined);
  });

  async function updateSnippetName(newName: string | undefined) {
    const $$activeWorkspace = activeWorkspace();
    if (!newName || !$$activeWorkspace || $$activeWorkspace.name === newName) {
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
    setInput(undefined);
    void updateSnippetName(value());
  }

  createEffect(
    () => (editing() ? form() : undefined),
    element => {
      if (element) return untrack(() => clickOutside(element, submit));
    },
  );

  createEffect(input, element => {
    element?.focus();
    element?.select();
  });

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
            <form
              ref={setForm}
              onSubmit={event => {
                event.preventDefault();
                submit();
              }}
              onKeyDown={event => {
                if (event.key !== 'Escape') return;
                event.stopPropagation();
                setEditing(false);
                setInput(undefined);
                setValue(activeWorkspace()?.name);
              }}
            >
              <FlexField size="md">
                <TextField
                  variant="inline"
                  classes={{input: styles.toolbarSnippetNameInput}}
                  ref={setInput}
                  size="sm"
                  value={value()}
                  onChange={setValue}
                />
              </FlexField>
            </form>
          </Show>
        </Show>
      </Box>
    </SuspenseEditorItem>
  );
}
