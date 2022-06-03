import {createSensorWithBoundary} from './createSensorWithBoundary';
import {DndRect} from './types';
import {Accessor, ParentProps} from 'solid-js';
import {pickProps} from 'solid-use';

interface DragDropSensorsWithBoundaryProps {
  boundary: Accessor<HTMLElement>;
  boundaryPadding?: DndRect;
}

export function DragDropSensorsWithBoundary(
  props: ParentProps<DragDropSensorsWithBoundaryProps>,
) {
  const pickedProps = pickProps(props, ['boundary', 'boundaryPadding']);
  createSensorWithBoundary(pickedProps.boundary, pickedProps.boundaryPadding);
  return <>{props.children}</>;
}
