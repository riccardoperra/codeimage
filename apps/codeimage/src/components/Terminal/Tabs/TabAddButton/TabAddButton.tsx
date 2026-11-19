import type {VoidProps} from 'solid-js';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../../i18n';
import type {WindowStyle} from '../../WindowStyles/WindowStyles';
import * as modern from '../Tab/WindowTabStyle.css';
import {Show} from 'solid-js';
import {PlusIcon} from '../../../Icons/PlusIcon';
import * as styles from './TabAddButton.css';

export interface TabAddButtonProps {
  appearance?: WindowStyle;
  onAdd: () => void;
  disabled: boolean;
}

export function TabAddButton(props: VoidProps<TabAddButtonProps>) {
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <button
      data-export-exclude="true"
      tabindex={-1}
      disabled={props.disabled}
      aria-label={t('frame.addTab')}
      class={props.appearance ? modern.add : styles.button}
      onClick={() => props.onAdd()}
    >
      <Show when={props.appearance} fallback={<PlusIcon size={'xs'} />}>
        +
      </Show>
    </button>
  );
}
