import {
  Component,
  createUniqueId,
  getOwner,
  lazy,
  onMount,
  runWithOwner,
} from 'solid-js';
import {MountableElement} from 'solid-js/web';
import {
  HydrateOnIdleProps,
  HydrateOnVisibleProps,
  onIdle,
  onLoad,
  onVisible,
} from '~/core/hydration/strategy';

export type HydratableProps =
  | ({strategy: 'visible'} & HydrateOnVisibleProps)
  | ({strategy: 'idle'} & HydrateOnIdleProps)
  | {strategy: 'load'};

export type HydratableComponentProps = {
  $hydration: HydratableProps;
};

type CreateHydration = {
  onHydratable: (
    onHydrate: (
      node: MountableElement,
      component: Component<unknown>,
    ) => Promise<void>,
  ) => void;
  id: string;
};

export function createHydration<
  THydratableProps extends HydratableComponentProps,
>(
  hydrationProps: THydratableProps,
  lazyComponent: ReturnType<typeof lazy>,
): CreateHydration {
  const id = createUniqueId();
  const owner = getOwner();

  return {
    onHydratable: onHydrate => {
      let rootElement: Element;
      onMount(() => {
        rootElement = document.querySelector(`[data-ch="${id}"]`);
        if (!rootElement) return;
        const initHydrationCallback = async () => {
          const component = await lazyComponent.preload();
          await runWithOwner(owner, () =>
            onHydrate(rootElement, component.default),
          );
        };
        switch (hydrationProps.$hydration.strategy) {
          case 'visible': {
            const config = {
              ...hydrationProps.$hydration,
              el: rootElement,
            };

            return onVisible(initHydrationCallback, config);
          }
          case 'idle': {
            return onIdle(initHydrationCallback, hydrationProps.$hydration);
          }
          case 'load': {
            return onLoad(initHydrationCallback);
          }
        }
      });
    },
    id,
  } as const;
}
