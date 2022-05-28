import {getRootEditorsState} from '@codeimage/store/editor';
import {For, VoidProps} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab.css';
import {TabAddButton} from './TabAddButton/TabAddButton';
import {WindowTab} from './WindowTab';

const exportExclude = _exportExclude;

export interface WindowTabListManager {
  accent: boolean;
}

export function WindowTabListManager(props: VoidProps<WindowTabListManager>) {
  const {
    tabs,
    editors,
    addEditor,
    isActive,
    removeEditor,
    setActiveEditor,
    setTabName,
  } = getRootEditorsState();

  return (
    <div
      class={styles.wrapper({
        multi: tabs.length > 0,
        accent: props.accent,
      })}
      data-accent-visible={props.accent}
    >
      <div class={styles.tabListWrapper}>
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
                accentMode={props.accent}
                active={active()}
                onClick={() => setActiveEditor(editor)}
                onTabChange={tabName => setTabName(tab.tabId, tabName)}
                onClose={tabs.length > 1 ? () => removeEditor(editor.id) : null}
              />
            );
          }}
        </For>
      </div>
      <TabAddButton onAdd={() => addEditor(null, true)} />
    </div>
  );
}
