import {LanguageIconDefinition} from '@codeimage/config';
import {Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Show, VoidProps} from 'solid-js';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import * as styles from './Tab.css';
import {TabIcon} from './TabIcon/TabIcon';

const exportExclude = _exportExclude;

export interface WindowTabProps {
  readonly id: string;
  readonly index: number;
  readonly tabName?: string | null;
  readonly tabIcon?: LanguageIconDefinition['content'];
  readonly accentMode: boolean;
  readonly active: boolean;
}

export function BaseWindowTab(props: VoidProps<WindowTabProps>) {
  return (
    <div
      use:exportExclude={!props.tabName?.length}
      class={styles.tab({
        accent: props.accentMode,
        active: props.active,
      })}
      data-host-index={props.index}
      data-accent-visible={props.accentMode}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
      data-active={props.active}
    >
      <Show when={props.tabIcon}>{icon => <TabIcon content={icon} />}</Show>
      <div class={styles.tabTextContent}>
        <Text size={'sm'} class={styles.fallbackText}>
          {props.tabName || 'Untitled'}
        </Text>
      </div>
    </div>
  );
}
