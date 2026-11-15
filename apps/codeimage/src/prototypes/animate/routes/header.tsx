import {AnimateRoute} from '../harness';

export default function AnimateHeaderPrototype() {
  return (
    <AnimateRoute
      variants={[
        {
          name: 'Current tab',
          axis: "Only the current step's tab; equal names do not change",
          config: {header: 'active'},
        },
        {
          name: 'Dots + title',
          axis: 'No tabs: the window dots and an optional fixed title',
          config: {header: 'none'},
        },
        {
          name: 'All tabs',
          axis: 'Every tab, the current one highlighted (today)',
          config: {header: 'all'},
        },
      ]}
    />
  );
}
