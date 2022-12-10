import {FlowProps, Ref} from 'solid-js';
import {Hydration} from 'solid-js/web';

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'custom-hydratable': {
        ref?: Ref<HTMLElement>;
        children: JSX.Element;
      };
    }
  }
}

interface CustomHydratableProps {
  id: string;
}

export function CustomHydratable(props: FlowProps<CustomHydratableProps>) {
  if (import.meta.env.SSR) {
    // eslint-disable-next-line solid/components-return-once
    return (
      <Hydration>
        <custom-hydratable data-ch={props.id}>
          {props.children}
        </custom-hydratable>
      </Hydration>
    );
  } else {
    // eslint-disable-next-line solid/reactivity,solid/components-return-once
    return props.children;
  }
}
