import pre from '@changesets/cli/dist/declarations/src/commands/pre';
import {useDragDropContext} from '@thisbeyond/solid-dnd';
import {Accessor, onCleanup, onMount, ParentComponent} from 'solid-js';
import {pickProps} from 'solid-use';

export const createPointerSensorWithBoundaryAndLockAxis = (
  boundary: Accessor<HTMLElement>,
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
      activeDraggable,
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

  const initialCoordinates = {x: 0, y: 0};

  let activationDelayTimeoutId: number | null = null;
  let activationDraggableId: string | number | null = null;

  const attach = (event: PointerEvent, draggableId: string | number): void => {
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    activationDraggableId = draggableId;
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

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  const constrainedBoundary = (event: PointerEvent): number => {
    const active = activeDraggable();
    if (!active) return 0;
    const x = event.clientX - initialCoordinates.x;
    const boundaryRect = boundary().getBoundingClientRect();
    const previewPos = -(initialCoordinates.x - boundaryRect.left);
    // TODO
    const minX = x <= 0 ? 0 : previewPos;

    const maxX =
      boundaryRect.right -
      (initialCoordinates.x + active.node.getBoundingClientRect().width);
    return clamp(x, minX, maxX);
  };

  const onPointerMove = (event: PointerEvent): void => {
    const transform = {
      x: event.clientX - initialCoordinates.x,
      y: 0,
    };

    if (!anySensorActive()) {
      if (Math.sqrt(transform.x ** 2 + transform.y ** 2) > activationDistance) {
        onActivate();
      }
    }

    if (isActiveSensor()) {
      event.preventDefault();

      const x = constrainedBoundary(event);

      dragMove({
        y: 0,
        x,
      });
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

export const DragDropSensorsWithBoundary: ParentComponent<{
  boundary: Accessor<HTMLElement>;
}> = props => {
  const pickedProps = pickProps(props, ['boundary']);
  createPointerSensorWithBoundaryAndLockAxis(pickedProps.boundary);
  return <>{props.children}</>;
};
