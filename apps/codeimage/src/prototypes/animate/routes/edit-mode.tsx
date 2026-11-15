import {AnimateRoute} from '../harness';

export default function AnimateEditModePrototype() {
  return (
    <AnimateRoute
      variants={[
        {
          name: 'Pill',
          axis: 'A pill over the canvas: click or type to edit step N',
          config: {editMode: 'pill'},
        },
        {
          name: 'Pause on a hold',
          axis: 'Editable automatically while paused inside a hold',
          config: {editMode: 'auto'},
        },
        {
          name: 'Preview ↔ Edit',
          axis: 'An explicit segmented control',
          config: {editMode: 'explicit'},
        },
      ]}
    />
  );
}
