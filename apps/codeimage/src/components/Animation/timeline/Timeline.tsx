import {MobileDetails} from './MobileDetails';
import {Show} from 'solid-js';
import {StripTimeline} from '../StripTimeline';
import {Filmstrip} from './Filmstrip';
import {timelineLayout} from './layout';
import {createTimelineModel} from './model';
import {Outline} from './Outline';
import {StepToolbar} from './StepToolbar';
import {TransitionPopover} from './TransitionPopover';
export function Timeline(props: {compact: boolean}) {
  const model = createTimelineModel();
  return (
    <>
      <StripTimeline model={model} />
      <Show
        when={!props.compact && timelineLayout() === 'filmstrip'}
        fallback={<Outline model={model} />}
      >
        <Filmstrip model={model} />
      </Show>
      <Show when={!props.compact} fallback={<MobileDetails model={model} />}>
        <StepToolbar model={model} />
      </Show>
      <TransitionPopover model={model} compact={props.compact} />
    </>
  );
}
