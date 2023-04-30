import {Motion} from '@motionone/solid';
import {createSignal, FlowProps, onMount} from 'solid-js';

export function DynamicSizedContainer(props: FlowProps) {
  let ref!: HTMLDivElement;
  let innerRef!: HTMLDivElement;

  const [rect, setRect] = createSignal<DOMRect>();

  onMount(() => {
    if (ref) {
      setRect(innerRef.getBoundingClientRect());

      const observer = new ResizeObserver(([entry]) => {
        requestAnimationFrame(() => {
          setRect(entry.target.getBoundingClientRect());
        });
      });

      observer.observe(innerRef);
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
        style={{
          width: 'fit-content',
          height: 'fit-content',
        }}
      >
        {props.children}
      </div>
    </Motion.div>
  );
}
