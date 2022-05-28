import {VoidProps} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../../core/directives/exportExclude';
import {PlusIcon} from '../../../Icons/PlusIcon';
import * as styles from './TabAddButton.css';

export interface TabAddButtonProps {
  onAdd: () => void;
}

export function TabAddButton(props: VoidProps<TabAddButtonProps>) {
  const exportExclude = _exportExclude;

  return (
    <button
      use:exportExclude={true}
      tabIndex={-1}
      class={styles.button}
      onClick={() => props.onAdd()}
    >
      <PlusIcon size={'xs'} />
    </button>
  );
}
