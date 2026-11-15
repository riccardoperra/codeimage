import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {DURATION_LIMITS, stepStartsMs} from '@codeimage/store/editor/animation';
import {Button, Popover, PopoverContent, PopoverTrigger} from '@codeui/kit';
import type {AnimationSettings} from '@core/animation/model';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './AnimationPanel.css';
import {DurationField} from './DurationField';
import {formatSeconds} from './Timeline';

// The step being dragged and the step it is over.
export interface StepDrag {
  from: number;
  over: number | null;
}

interface AnimationStepProps {
  step: AnimationSettings['steps'][number];
  index: number;
  current: boolean;
  drag: StepDrag | null;
  onDragChange: (drag: StepDrag | null) => void;
}

export function AnimationStep(props: AnimationStepProps) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const tabName = () =>
    editor.state.editors.find(({id}) => id === props.step.editorId)?.tab
      .tabName || t('animation.untitledTab');
  const isLast = () => props.index === animation.settings().steps.length - 1;

  const onSeek = () =>
    animation.actions.seek(stepStartsMs(animation.settings())[props.index]);
  const onHoldChange = (holdMs: number) =>
    animation.actions.setHoldMs(props.step.editorId, holdMs);
  const onMoveEarlier = () =>
    animation.actions.moveStep(props.index, props.index - 1);
  const onMoveLater = () =>
    animation.actions.moveStep(props.index, props.index + 1);
  // The hold button sits inside the step, and a click in its popover bubbles
  // to the step through the portal. Neither moves the playhead.
  const onHoldClick = (event: MouseEvent) => event.stopPropagation();

  const onDragStart = (event: DragEvent) => {
    event.dataTransfer?.setData('text/plain', props.step.editorId);
    props.onDragChange({from: props.index, over: null});
  };
  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (props.drag && props.drag.over !== props.index) {
      props.onDragChange({...props.drag, over: props.index});
    }
  };
  const onDragLeave = () => {
    if (props.drag) props.onDragChange({...props.drag, over: null});
  };
  const onDragEnd = () => props.onDragChange(null);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (props.drag && props.drag.from !== props.index) {
      animation.actions.moveStep(props.drag.from, props.index);
    }
    props.onDragChange(null);
  };

  return (
    <li
      class={styles.step}
      draggable={true}
      data-current={props.current ? '' : undefined}
      data-dragging={props.drag?.from === props.index ? '' : undefined}
      data-drop-target={
        props.drag?.over === props.index && props.drag.from !== props.index
          ? ''
          : undefined
      }
      onClick={onSeek}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <span class={styles.stepIndex}>{props.index + 1}</span>
      <span class={styles.stepName}>{tabName()}</span>
      <Popover placement={'top'}>
        <PopoverTrigger
          class={styles.stepHold}
          aria-label={t('animation.holdFor', {
            tab: tabName(),
            time: formatSeconds(props.step.holdMs),
          })}
          onClick={onHoldClick}
        >
          {formatSeconds(props.step.holdMs)}
        </PopoverTrigger>
        <PopoverContent
          title={tabName()}
          class={styles.popover}
          onClick={onHoldClick}
        >
          <DurationField
            id={`animationHold-${props.index}`}
            label={t('animation.hold')}
            limits={DURATION_LIMITS.holdMs}
            step={100}
            value={props.step.holdMs}
            onChange={onHoldChange}
          />
          <div class={styles.popoverActions}>
            <Button
              size={'xs'}
              theme={'secondary'}
              disabled={props.index === 0}
              onClick={onMoveEarlier}
            >
              {t('animation.moveEarlier')}
            </Button>
            <Button
              size={'xs'}
              theme={'secondary'}
              disabled={isLast()}
              onClick={onMoveLater}
            >
              {t('animation.moveLater')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </li>
  );
}
