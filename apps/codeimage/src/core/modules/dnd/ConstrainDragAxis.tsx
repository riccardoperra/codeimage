import type {Transformer} from '@thisbeyond/solid-dnd';
import {useDragDropContext} from '@thisbeyond/solid-dnd';

export const ConstrainDragAxis = () => {
  const [, {onDragStart, onDragEnd, addTransformer, removeTransformer}] =
    useDragDropContext()!;

  const transformer: {
    id: string;
    order: number;
    callback: Transformer['callback'];
  } = {
    id: 'constrain-x-axis',
    order: 100,
    callback: transform => ({...transform, y: 0}),
  };

  onDragStart(({draggable}) => {
    addTransformer('draggables', draggable.id, transformer);
  });

  onDragEnd(({draggable}) => {
    removeTransformer('draggables', draggable.id, transformer.id);
  });

  return <></>;
};
