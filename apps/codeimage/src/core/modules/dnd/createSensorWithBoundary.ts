import {DndRect} from './types';
import {useDragDropContext} from '@thisbeyond/solid-dnd';
import {Accessor, onCleanup, onMount} from 'solid-js';

/**
 * @private
 * @param boundary
 * @param boundaryPadding
 * @param id
 */
export const createSensorWithBoundary = (
  boundary: Accessor<HTMLElement>,
  boundaryPadding?: DndRect,
  id: string | number = 'pointer-sensor-with-boundary',
): void => {
  const [
    state,
    {
      addSensor,
      removeSensor,
      sensorStart,
      sensorEnd,
      dragStart,
      dragMove,
      dragEnd,
      anySensorActive,
    },
  ] = useDragDropContext()!;
  const activationDelay = 250; // milliseconds
  const activationDistance = 10; // pixels

  onMount(() => {
    addSensor({id, activators: {pointerdown: attach}});
  });

  onCleanup(() => {
    removeSensor(id);
  });

  const isActiveSensor = () => state.active.sensor === id;
  const initialCoordinates = {x: 0, y: 0, rect: {} as DOMRect};
  let activationDelayTimeoutId: number | null = null;
  let activationDraggableId: string | number | null = null;

  const attach = (event: PointerEvent, draggableId: string | number): void => {
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    activationDraggableId = draggableId;
    initialCoordinates.rect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    initialCoordinates.x = event.clientX;
    initialCoordinates.y = event.clientY;

    activationDelayTimeoutId = window.setTimeout(onActivate, activationDelay);
  };

  const detach = (): void => {
    if (activationDelayTimeoutId) {
      clearTimeout(activationDelayTimeoutId);
      activationDelayTimeoutId = null;
    }

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('selectionchange', clearSelection);
  };

  const onActivate = (): void => {
    if (!anySensorActive()) {
      sensorStart(id);
      dragStart(activationDraggableId!);

      clearSelection();
      document.addEventListener('selectionchange', clearSelection);
    } else if (!isActiveSensor()) {
      detach();
    }
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const constrainedBoundary = (event: PointerEvent): {x: number; y: number} => {
    const defaultPadding = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      ...(boundaryPadding ?? {}),
    };
    const boundaryRect = boundary().getBoundingClientRect();
    const x = event.clientX - initialCoordinates.x;
    const y = event.clientY - initialCoordinates.y;
    const spaceLeft =
      boundaryRect.left - initialCoordinates.rect.left + defaultPadding.left;
    const spaceRight =
      boundaryRect.right - initialCoordinates.rect.right - defaultPadding.right;
    const spaceTop =
      boundaryRect.top - initialCoordinates.rect.top - defaultPadding.top;
    const spaceBottom =
      boundaryRect.bottom -
      initialCoordinates.rect.bottom -
      defaultPadding.bottom;
    return {
      x: clamp(x, spaceLeft, spaceRight),
      y: clamp(y, spaceBottom, spaceTop),
    };
  };

  const onPointerMove = (event: PointerEvent): void => {
    const transform = {
      x: event.clientX - initialCoordinates.x,
      y: event.clientY - initialCoordinates.y,
    };

    if (!anySensorActive()) {
      if (Math.sqrt(transform.x ** 2 + transform.y ** 2) > activationDistance) {
        onActivate();
      }
    }

    if (isActiveSensor()) {
      event.preventDefault();
      const transformWithBoundary = constrainedBoundary(event);
      dragMove(transformWithBoundary);
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    detach();
    if (isActiveSensor()) {
      event.preventDefault();
      dragEnd();
      sensorEnd();
    }
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };
};
