import {getAuthState} from '@codeimage/store/auth/auth';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorInit';
import {Box, FlexField, Loading, Text, TextField} from '@codeimage/ui';
import clickOutside from '@core/directives/clickOutside';
import {createSignal, onMount, Show, untrack} from 'solid-js';
import {API} from '../../data-access/api';
import {useHotkey} from '../../hooks/use-hotkey';

void clickOutside;

export function ToolbarSnippetName() {
  const [editing, setEditing] = createSignal(false);
  const {activeWorkspace} = getEditorSyncAdapter();
  const loggedIn = () => getAuthState().loggedIn();
  const [value, setValue] = createSignal(activeWorkspace()?.name || undefined);
  const {remoteSync} = getEditorSyncAdapter();

  async function updateSnippetName(newName: string) {
    const $$activeWorkspace = activeWorkspace();
    if (!$$activeWorkspace || $$activeWorkspace.name === value()) return;
    setValue(newName);
    await API.workpace.updateSnippetName($$activeWorkspace.id, newName);
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
          <>
            <Loading visibility={remoteSync() ? 'visible' : 'hidden'} />
            <Text size={'sm'} onClick={toggleEdit}>
              {value() ?? 'Untitled'}
            </Text>
          </>
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
            onMount(() =>
              useHotkey(ref!, {
                Enter: () => {
                  setEditing(false);
                  updateSnippetName(value());
                },
                Esc: () => {
                  setEditing(false);
                  setValue(name);
                },
              }),
            );

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
