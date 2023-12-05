import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorState} from '@codeimage/store/editor/model';
import {ErrorBoundary, Suspense, VoidProps} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import {FrameSkeleton} from '../../Frame/FrameSkeleton';
import * as styles from './Tab/Tab.css';
import {WindowTab, WindowTabContentText} from './Tab/WindowTab';

export interface TerminalWindowTabListPreviewProps {
  accent: boolean;
  readOnly: boolean;
  lite?: boolean;
  preview?: boolean;
}

interface PreviewTabProps {
  editor: EditorState;
  accent: boolean;
}

function PreviewTab(props: PreviewTabProps) {
  const icon = createTabIcon(
    () => props.editor.tab.tabName ?? null,
    () => props.editor.languageId,
    true,
  );

  return (
    <WindowTab
      tabIcon={icon()?.content}
      accentMode={props.accent}
      active={true}
      index={0}
      content={
        <WindowTabContentText>{props.editor.tab.tabName}</WindowTabContentText>
      }
    />
  );
}

export function TerminalWindowTabListPreview(
  props: VoidProps<TerminalWindowTabListPreviewProps>,
) {
  const {state} = getRootEditorStore();

  return (
    <ErrorBoundary fallback={<FrameSkeleton />}>
      <Suspense>
        <div
          class={styles.wrapper({accent: props.accent})}
          data-accent-visible={props.accent}
        >
          <div class={styles.tabListWrapper}>
            <PreviewTab accent={props.accent} editor={state.editors[0]} />
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
