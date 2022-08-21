import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorInit';
import {
  Box,
  FlexField,
  HStack,
  LoadingCircle,
  Text,
  TextField,
} from '@codeimage/ui';
import clickOutside from '@core/directives/clickOutside';
import {createEffect, createSignal, on, onMount, Show, untrack} from 'solid-js';
import {API} from '../../data-access/api';
import {useHotkey} from '../../hooks/use-hotkey';
import {PencilAlt} from '../Icons/Pencil';

void clickOutside;

export function ToolbarSnippetName() {
  const [editing, setEditing] = createSignal(false);
  const loggedIn = () => getAuth0State().loggedIn();
  const {remoteSync, activeWorkspace} = getEditorSyncAdapter()!;
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

  return (
    <Box display={'flex'} alignItems={'center'}>
      <Show
        fallback={
          <HStack spacing={'2'} alignItems={'center'} lineHeight={'normal'}>
            <LoadingCircle
              visibility={remoteSync() ? 'visible' : 'hidden'}
              size={'sm'}
            />
            <Text size={'sm'} onClick={toggleEdit}>
              {value() ?? 'Untitled'}
            </Text>
            <PencilAlt size={'sm'} />
          </HStack>
        }
        when={editing()}
      >
        <div
          use:clickOutside={() => {
            setEditing(false);
            updateSnippetName(value());
          }}
        >
          {() => {
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
                  console.log('esc click');
                  setEditing(false);
                  setValue(value());
                },
              });
            });

            return (
              <FlexField size={'xs'}>
                <TextField
                  ref={ref}
                  size={'sm'}
                  type={'text'}
                  autofocus={true}
                  value={value()}
                  onChange={value => setValue(value)}
                  style={{
                    'text-align': 'center',
                  }}
                />
              </FlexField>
            );
          }}
        </div>
      </Show>
    </Box>
  );
}
