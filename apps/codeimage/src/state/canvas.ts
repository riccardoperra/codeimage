import {createStore} from 'solid-js/store';

export const [canvasSize, setCanvasSize] = createStore({
  canvasWidth: 0,
  canvasHeight: 0,
});
