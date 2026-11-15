import {AnimateRoute} from '../harness';

export default function AnimateDurationPrototype() {
  return (
    <AnimateRoute
      autoplay
      variants={[
        {
          name: '700 ms',
          axis: 'Default transition of 700 ms',
          config: {defaultTransitionMs: 700},
        },
        {
          name: '900 ms',
          axis: 'Default transition of 900 ms',
          config: {defaultTransitionMs: 900},
        },
      ]}
    />
  );
}
