import {AnimateRoute} from '../harness';

export default function AnimateEasingPrototype() {
  return (
    <AnimateRoute
      variants={[
        {name: 'Curve', axis: 'A static curve', config: {curve: 'static'}},
        {
          name: 'Curve + playhead',
          axis: 'A dot on the curve synced to the playhead',
          config: {curve: 'dot'},
        },
        {
          name: 'Curve + token',
          axis: 'A token chip that runs once on each change',
          config: {curve: 'chip'},
        },
      ]}
    />
  );
}
