import {useDragDropContext} from '@thisbeyond/solid-dnd';
import {Transform} from '@thisbeyond/solid-dnd/dist/types/layout';

export const ConstrainDragAxis = () => {
  const [, {onDragStart, onDragEnd, addTransformer, removeTransformer}] =
    useDragDropContext()!;

  const transformer: {
    id: string;
    order: number;
    callback: (transform: Transform) => Transform;
  } = {
    id: 'constrain-x-axis',
    order: 100,
    callback: (transform: Transform) => ({...transform, y: 0}),
  };

  onDragStart(({draggable}) => {
    addTransformer('draggables', draggable.id, transformer);
  });

  onDragEnd(({draggable}) => {
    removeTransformer('draggables', draggable.id, transformer.id);
  });

  return <></>;
};
