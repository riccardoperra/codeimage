import {$rootEditorState, EditorState} from '@codeimage/store/editor';
import {Box, Button, SvgIcon} from '@codeimage/ui';
import {For} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab.css';
import {WindowTab} from './WindowTab';

export interface WindowTabListManagerProps {
  tabName?: string;
  tabIcon?: string;
  active?: boolean;
}

export function WindowTabListManager(props: {editors: EditorState[]}) {
  const {editors, tabs, setTabs, addEditor, isActive, setActiveEditor} =
    $rootEditorState;

  return (
    <div
      class={styles.wrapper({
        multi: editors.length > 0,
        accent: true,
      })}
    >
      <For each={tabs}>
        {(tab, index) => {
          const editorState = editors[index()];

          const icon = createTabIcon(
            () => tab.tabName ?? null,
            () => editorState.languageId,
            true,
          );

          return (
            <WindowTab
              tabName={tab.tabName ?? 'Untitled'}
              tabIcon={icon()?.content}
              readonlyTab={!isActive(index())}
              accentMode={false}
              active={isActive(index())}
              onClick={() => setActiveEditor(editorState)}
              onTabChange={tabName =>
                setTabs(index(), tab => ({...tab, tabName}))
              }
            />
          );
        }}
      </For>
      <Button
        size={'xs'}
        variant={'solid'}
        theme={'secondary'}
        onClick={() => addEditor(null, true)}
      >
        <SvgIcon fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </SvgIcon>
      </Button>
    </div>
  );
}
