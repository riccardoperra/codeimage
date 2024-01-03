import {IconButton} from '@codeui/kit';
import {icon} from './DiffCheckbox.css';

export type DiffCheckboxState = 'added' | 'removed' | 'untouched';

interface DiffCheckboxProps {
  value: DiffCheckboxState;
  onChange: (value: DiffCheckboxState) => void;
}

export function DiffCheckbox(props: DiffCheckboxProps) {
  const statesTransition: Record<DiffCheckboxState, DiffCheckboxState> = {
    added: 'removed',
    removed: 'untouched',
    untouched: 'added',
  };

  const onClick = (value: DiffCheckboxState) => {
    props.onChange(statesTransition[value]);
  };

  const label = () => {
    switch (props.value) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'untouched':
        return null;
    }
  };

  const title = () => {
    switch (props.value) {
      case 'added':
        return 'Set to removed';
      case 'removed':
        return 'Set to untouched';
      case 'untouched':
        return 'Set to added';
    }
  };

  return (
    <div>
      <IconButton
        size={'xs'}
        theme={'secondary'}
        class={icon()}
        title={title()}
        aria-label={title()}
        onClick={() => onClick(props.value)}
      >
        {label()}
      </IconButton>
    </div>
  );
}
