import {animate, type AnimationControls} from 'motion';
import {type FlowProps, onCleanup, onMount} from 'solid-js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DynamicSizedContainerProps {}

function toPx(value: number) {
  return `${value}px`;
}

export function DynamicSizedContainer(
  props: FlowProps<DynamicSizedContainerProps>,
) {
  let ref!: HTMLDivElement;
  let animation: AnimationControls | null = null;

  const triggerAnimation = (width: string, height: string) => {
    return animate(
      ref,
      {
        width,
        height,
      },
      {duration: 0.2, easing: [0.4, 0, 0.2, 1]},
    );
  };

  const recalculateSize = () => {
    if (animation && animation.playState === 'running') {
      animation.stop();
      animation = null;
    }
    const currentWidth = ref.offsetWidth;
    const currentHeight = ref.offsetHeight;
    ref.style.width = 'auto';
    ref.style.height = 'auto';
    const newWidth = toPx(ref.offsetWidth);
    const newHeight = toPx(ref.offsetHeight);
    ref.style.width = toPx(currentWidth);
    ref.style.height = toPx(currentHeight);
    setTimeout(() => {
      animation = triggerAnimation(newWidth, newHeight);
    }, 0);
  };

  onMount(() => {
    if (!ref) return;
    recalculateSize();
    const resizeObserver = new MutationObserver(recalculateSize);
    resizeObserver.observe(ref, {childList: true, subtree: true});
    return onCleanup(() => resizeObserver.disconnect());
  });

  return <div ref={ref}>{props.children}</div>;
}
