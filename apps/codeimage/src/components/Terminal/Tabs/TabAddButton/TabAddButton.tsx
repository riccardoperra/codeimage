import type {VoidProps} from 'solid-js';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
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
  const exportExclude = _exportExclude;
  void exportExclude;

  return (
    <button
      use:exportExclude={true}
      tabIndex={-1}
      disabled={props.disabled}
      aria-label={props.appearance ? t('frame.addTab') : undefined}
      class={props.appearance ? modern.add : styles.button}
      onClick={() => props.onAdd()}
    >
      <Show when={props.appearance} fallback={<PlusIcon size={'xs'} />}>
        +
      </Show>
    </button>
  );
}
