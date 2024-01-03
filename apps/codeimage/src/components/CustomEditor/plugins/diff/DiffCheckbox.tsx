import {IconButton, Tooltip} from '@codeui/kit';
import {createSignal} from 'solid-js';
import {icon, tooltip} from './DiffCheckbox.css';

export type DiffCheckboxState = 'added' | 'removed' | 'untouched';

interface DiffCheckboxProps {
  value: DiffCheckboxState;
  onChange: (value: DiffCheckboxState) => void;
}

export function DiffCheckbox(props: DiffCheckboxProps) {
  let el!: HTMLButtonElement;
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const statesTransition: Record<DiffCheckboxState, DiffCheckboxState> = {
    added: 'removed',
    removed: 'untouched',
    untouched: 'added',
  };

  const onClick = (value: DiffCheckboxState) => {
    props.onChange(statesTransition[value]);
    if (el.matches(':hover').valueOf()) {
      requestAnimationFrame(() => setTooltipOpen(true));
    }
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
      <Tooltip
        open={tooltipOpen()}
        onOpenChange={setTooltipOpen}
        slotClasses={{
          content: tooltip,
        }}
        placement={'right'}
        content={title()}
        theme={'secondary'}
        openDelay={300}
        closeDelay={0}
      >
        <IconButton
          ref={el}
          size={'xs'}
          class={icon()}
          aria-label={title()}
          onClick={() => onClick(props.value)}
        >
          {label()}
        </IconButton>
      </Tooltip>
    </div>
  );
}
