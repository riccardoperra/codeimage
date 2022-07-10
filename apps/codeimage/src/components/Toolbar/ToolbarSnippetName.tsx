import {Box, FlexField, Text, TextField} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import clickOutside from '@core/directives/clickOutside';
import {useRouteData} from 'solid-app-router';
import {createSignal, onMount, Show} from 'solid-js';
import {useHotkey} from '../../hooks/use-hotkey';
import {WorkspaceItem} from '../../pages/Dashboard/Dashboard';
import {ChevronDownIcon} from '../Icons/ChevronDown';

void clickOutside;

export function ToolbarSnippetName() {
  const [editing, setEditing] = createSignal(false);
  const {name, id} = useRouteData<WorkspaceItem>() ?? {};
  const [value, setValue] = createSignal(name);

  async function updateSnippetName(newName: string) {
    if (name === value()) {
      return;
    }
    setValue(newName);
    await supabase
      .from<WorkspaceItem>('workspace_item')
      .update({name: newName})
      .eq('id', id);
  }

  return (
    <Box display={'flex'} alignItems={'center'}>
      <Show
        fallback={
          <>
            <Text size={'sm'} onClick={() => setEditing(true)}>
              {value()}
            </Text>
            <ChevronDownIcon width={20} height={20} />
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
