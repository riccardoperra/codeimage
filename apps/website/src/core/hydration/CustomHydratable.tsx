import {HTMLElement} from 'node-html-parser';
import {FlowProps, Ref} from 'solid-js';
import {Hydration} from 'solid-js/web';

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'custom-hydratable': JSX.IntrinsicElements['div'] & {
        ref?: Ref<HTMLElement>;
        children: JSX.Element;
      };
    }
  }
}

interface CustomHydratableProps {
  id: string;
  elementId?: string;
}

export function CustomHydratable(props: FlowProps<CustomHydratableProps>) {
  return (
    <Hydration>
      <custom-hydratable data-ch={props.id} id={props.elementId}>
        {props.children}
      </custom-hydratable>
    </Hydration>
  );
  // Why solid-start island use this approach?
  // if (import.meta.env.SSR) {
  //   // eslint-disable-next-line solid/components-return-once
  //   return (
  //     <Hydration>
  //       <custom-hydratable data-ch={props.id} id={props.elementId}>
  //         {props.children}
  //       </custom-hydratable>
  //     </Hydration>
  //   );
  // } else {
  //   // eslint-disable-next-line solid/reactivity,solid/components-return-once
  //   return props.children;
  // }
}
