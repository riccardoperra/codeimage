import {$rootEditorState} from '@codeimage/store/editor';
import {Button, SvgIcon} from '@codeimage/ui';
import {For} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab.css';
import {WindowTab} from './WindowTab';

const exportExclude = _exportExclude;

export function WindowTabListManager() {
  const {
    tabs,
    editors,
    addEditor,
    isActive,
    removeEditor,
    setActiveEditor,
    setTabName,
  } = $rootEditorState;

  return (
    <div
      class={styles.wrapper({
        multi: tabs.length > 0,
        accent: true,
      })}
    >
      <For each={tabs}>
        {(tab, index) => {
          const editor = editors[index()];

          const icon = createTabIcon(
            () => tab.tabName ?? null,
            () => editor.languageId,
            true,
          );

          const active = () => isActive(editor.id);

          return (
            <WindowTab
              tabName={tab.tabName}
              tabIcon={icon()?.content}
              readonlyTab={!active()}
              accentMode={false}
              active={active()}
              onClick={() => setActiveEditor(editor)}
              onTabChange={tabName => setTabName(tab.tabId, tabName)}
              onClose={() => removeEditor(editor.id)}
            />
          );
        }}
      </For>
      <div use:exportExclude={true}>
        <Button
          size={'xs'}
          variant={'solid'}
          theme={'secondary'}
          tabIndex={-1}
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
    </div>
  );
}
