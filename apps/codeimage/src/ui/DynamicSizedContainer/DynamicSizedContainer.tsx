import {Motion} from '@motionone/solid';
import {createSignal, FlowProps, onCleanup, onMount} from 'solid-js';

interface DynamicSizedContainerProps {
  // TODO: not reactive
  enabled?: boolean;
}

export function DynamicSizedContainer(
  props: FlowProps<DynamicSizedContainerProps>,
) {
  let ref!: HTMLDivElement;
  let innerRef!: HTMLDivElement;

  const [rect, setRect] = createSignal<DOMRect>();

  onMount(() => {
    if (ref && props.enabled) {
      setRect(innerRef.getBoundingClientRect());

      const observer = new ResizeObserver(([entry]) => {
        requestAnimationFrame(() => {
          setRect(entry.target.getBoundingClientRect());
        });
      });

      observer.observe(innerRef);

      return onCleanup(() => observer.unobserve(innerRef));
    }
  });

  return (
    <Motion.div
      animate={{
        width: `${rect()?.width}px`,
        height: `${rect()?.height}px`,
      }}
      transition={{
        easing: [0.4, 0, 0.2, 1],
      }}
      ref={ref}
    >
      <div
        ref={innerRef}
        style={
          props.enabled
            ? {
                width: 'fit-content',
                height: 'fit-content',
              }
            : {width: '100%', height: '1005'}
        }
      >
        {props.children}
      </div>
    </Motion.div>
  );
}
