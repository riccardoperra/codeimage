import {Motion} from '@motionone/solid';
import {FlowProps, onCleanup, onMount} from 'solid-js';
import {createStore} from 'solid-js/store';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DynamicSizedContainerProps {}

function toPx(value: number) {
  return `${value}px`;
}

export function DynamicSizedContainer(
  props: FlowProps<DynamicSizedContainerProps>,
) {
  const [size, setSize] = createStore({width: 'auto', height: 'auto'});
  let ref!: HTMLDivElement;

  function recalculateSize() {
    const currentWidth = ref.offsetWidth;
    const currentHeight = ref.offsetHeight;
    ref.style.width = 'auto';
    ref.style.height = 'auto';
    const newWidth = toPx(ref.offsetWidth);
    const newHeight = toPx(ref.offsetHeight);
    ref.style.width = toPx(currentWidth);
    ref.style.height = toPx(currentHeight);
    setTimeout(() => setSize({width: newWidth, height: newHeight}), 0);
  }

  onMount(() => {
    if (ref) {
      recalculateSize();
      const resizeObserver = new MutationObserver(() => recalculateSize());
      resizeObserver.observe(ref, {childList: true, subtree: true});
      return onCleanup(() => resizeObserver.disconnect());
    }
  });

  return (
    <Motion.div
      animate={{
        width: size.width,
        height: size.height,
      }}
      transition={{
        duration: 0.2,
        easing: [0.4, 0, 0.2, 1],
      }}
      ref={ref}
    >
      {props.children}
    </Motion.div>
  );
}
