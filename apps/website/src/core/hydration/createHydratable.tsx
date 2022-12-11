import {
  Component,
  createComponent,
  JSXElement,
  lazy,
  ParentProps,
  splitProps,
} from 'solid-js';
import {hydrate, NoHydration} from 'solid-js/web';
import {createHydration, HydratableComponentProps} from './createHydration';
import {CustomHydratable} from './CustomHydratable';

export function createHydratable<
  T extends Component<unknown>,
  TProps = T extends Component<infer Props> ? Props : never,
>(
  dynamic: () => Promise<{default: T}>,
): (props: ParentProps<HydratableComponentProps & TProps>) => JSXElement {
  const LazyComponent = lazy(dynamic);

  const HydratableComponent = () => {
    return (
      <NoHydration>
        <LazyComponent />
      </NoHydration>
    );
  };

  return props => {
    const {onHydratable, id} = createHydration(props, LazyComponent);

    if (!import.meta.env.SSR) {
      onHydratable(async (node, component) => {
        const [, others] = splitProps(props, ['$hydration']);
        const $$component = createComponent(component, others);
        hydrate(() => $$component, node, {renderId: id});
      });
    }

    return (
      <CustomHydratable id={id}>
        <HydratableComponent />
      </CustomHydratable>
    );
  };
}
