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

export type CreateHydratableReturnCallback<T, TSectionId> = {
  sectionId: TSectionId;
} & ((props: ParentProps<HydratableComponentProps & T>) => JSXElement);

export function createHydratable<
  T extends Component<unknown>,
  SectionId extends string | undefined = undefined,
  TProps = T extends Component<infer Props> ? Props : never,
>(
  dynamic: () => Promise<{default: T}>,
  sectionId?: SectionId,
): CreateHydratableReturnCallback<TProps, SectionId> {
  const LazyComponent = lazy(dynamic);

  const HydratableComponent = () => {
    return (
      <NoHydration>
        <LazyComponent />
      </NoHydration>
    );
  };

  return Object.assign(
    props => {
      const {onHydratable, id} = createHydration(props, LazyComponent);

      if (!import.meta.env.SSR) {
        onHydratable(async (node, component) => {
          const [, others] = splitProps(props, ['$hydration']);
          const $$component = createComponent(component, others);
          hydrate(() => $$component, node, {renderId: id});
        });
      }

      return (
        <CustomHydratable elementId={props.id ?? sectionId} id={id}>
          <HydratableComponent />
        </CustomHydratable>
      );
    },
    {
      sectionId,
    },
  );
}
