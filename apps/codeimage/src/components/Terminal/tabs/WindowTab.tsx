import {LanguageIconDefinition} from '@codeimage/config';
import {Box, Text} from '@codeimage/ui';
import {Show, VoidProps} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {CloseIcon} from '../../Icons/CloseIcon';
import * as styles from './Tab.css';
import {TabIcon} from './TabIcon';
import {TabName} from './TabName';

const exportExclude = _exportExclude;

interface WindowTabProps {
  readonly tabName?: string | null;
  readonly tabIcon?: LanguageIconDefinition['content'];
  readonly readonlyTab: boolean;
  readonly accentMode: boolean;
  readonly active: boolean;
  readonly onTabChange: (value: string) => void;
  readonly onClick?: () => void;
  readonly onClose?: () => void;
}

export function WindowTab(props: VoidProps<WindowTabProps>) {
  return (
    <div
      use:exportExclude={!props.tabName?.length}
      class={styles.tab({
        accent: props.accentMode,
        active: props.active,
      })}
      onClick={() => props.onClick?.()}
    >
      <Show when={props.tabIcon}>{icon => <TabIcon content={icon} />}</Show>
      <Box marginY={'auto'}>
        <Show
          fallback={<Text size={'sm'}>{props.tabName || 'Untitled'}</Text>}
          when={!props.readonlyTab && props.active}
        >
          <TabName
            readonly={props.readonlyTab}
            value={props.tabName ?? ''}
            onValueChange={value => props.onTabChange?.(value)}
          />
        </Show>
      </Box>
      <CloseIcon
        class={styles.tabCloseIcon}
        onClick={() => props.onClose?.()}
        size={'xs'}
      />
    </div>
  );
}
