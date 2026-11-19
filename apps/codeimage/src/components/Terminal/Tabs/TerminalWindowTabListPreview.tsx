import type {VoidProps} from 'solid-js';
import {Errored, Loading as LoadingBoundary} from 'solid-js';
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
  accent: boolean;
  lite: boolean;
}

function PreviewTab(props: PreviewTabProps) {
  return (
    <WindowTab
      accentMode={props.accent}
      active={true}
      lite={props.lite}
      index={0}
      content={<WindowTabContentText>{'Untitled'}</WindowTabContentText>}
    />
  );
}

export function TerminalWindowTabListPreview(
  props: VoidProps<TerminalWindowTabListPreviewProps>,
) {
  return (
    <Errored fallback={<FrameSkeleton />}>
      <LoadingBoundary>
        <div
          class={styles.wrapper({accent: props.accent})}
          data-accent-visible={String(props.accent)}
        >
          <div class={styles.tabListWrapper}>
            <PreviewTab lite={props.lite ?? false} accent={props.accent} />
          </div>
        </div>
      </LoadingBoundary>
    </Errored>
  );
}
