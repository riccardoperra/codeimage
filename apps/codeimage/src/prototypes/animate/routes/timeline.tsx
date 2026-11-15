import {AnimateRoute} from '../harness';

export default function AnimateTimelinePrototype() {
  return (
    <AnimateRoute
      variants={[
        {
          name: 'Strip',
          axis: 'One track, holds and transitions alternating',
          config: {timeline: 'strip'},
        },
        {
          name: 'Two rails',
          axis: 'Holds on one rail, transitions on a rail below',
          config: {timeline: 'rails'},
        },
        {
          name: 'Step blocks',
          axis: 'Each hold joined to its outgoing transition',
          config: {timeline: 'blocks'},
        },
      ]}
    />
  );
}
