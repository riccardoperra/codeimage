import {Range} from '@solid-primitives/range';
import {debounceTime, fromEvent, startWith, throttleTime} from 'rxjs';
import {
  Accessor,
  createContext,
  createMemo,
  FlowProps,
  JSX,
  JSXElement,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import {createStore} from 'solid-js/store';

interface VirtualizeItemProps {
  fallback: JSX.Element;
  key: number;
}

type VirtualizeContextProps = IntersectionObserverInit & {
  scrollElement: HTMLElement;
  height: number;
  itemCount: number;
  gridCount: number;
};

type VirtualizeContext = {
  register: (props: VirtualizeItemProps) => Accessor<boolean>;
  visibilityRange: {start: number; end: number};
};

export function groupArrayByN<T>(data: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < data.length; i += n) result.push(data.slice(i, i + n));
  return result;
}

const $VirtualizeContext = createContext<VirtualizeContext>();

export function VirtualizeContext(props: FlowProps<VirtualizeContextProps>) {
  const [visibilityRange, setVisibilityRange] = createStore({
    start: -1,
    end: -1,
  });

  onMount(() => {
    const array = Array.from({length: props.itemCount}, (_, i) => i);
    const groupedArray = groupArrayByN(array, props.gridCount);

    const $ = fromEvent(props.scrollElement, 'scroll')
      .pipe(startWith(0))
      .subscribe(() =>
        render(
          props.height,
          props.scrollElement.scrollTop - props.height,
          props.scrollElement.scrollTop +
            props.scrollElement.offsetHeight +
            props.height,
        ),
      );

    onCleanup(() => $.unsubscribe());

    function render(height: number, scrollTop: number, scrollBottom: number) {
      let start: number | undefined;
      let end: number | undefined;

      function calculateVisibility(index: number, height: number) {
        const top = index * height;
        const bottom = top + height;
        return top <= scrollTop
          ? scrollTop - top <= height
          : bottom - scrollBottom <= height;
      }

      outerLoop: for (let i = 0; i < groupedArray.length; i++) {
        const el = groupedArray[i];
        for (let y = 0; y < el.length; y++) {
          if (start !== undefined && end !== undefined) {
            break outerLoop;
          }
          const visible = calculateVisibility(i, height);
          if (start === undefined && visible) {
            start = el[y];
            continue;
          }
          if (start !== undefined && !visible) {
            end = el[y];
            break outerLoop;
          }
        }
      }
      if (visibilityRange.start !== start || visibilityRange.end !== end) {
        setVisibilityRange({
          start: start ?? 0,
          end: end ?? props.itemCount,
        });
      }
    }
  });

  const register = (): Accessor<boolean> => {
    return () => true;
  };

  const startHeight = () => {
    return (visibilityRange.start * props.height) / props.gridCount;
  };

  const endHeight = createMemo(() => {
    const delta = props.itemCount - visibilityRange.end;
    return (delta * props.height) / props.gridCount;
  });

  return (
    <$VirtualizeContext.Provider
      value={{
        register,
        visibilityRange,
      }}
    >
      <div
        style={{
          height: `${startHeight()}px`,
        }}
      />
      {props.children}
      <div
        style={{
          height: `${endHeight()}px`,
        }}
      />
    </$VirtualizeContext.Provider>
  );
}

export function VirtualizeItem(
  props: FlowProps<VirtualizeItemProps, (index: number) => JSXElement>,
) {
  return props.children(props.key);
}

export function VirtualizeList(props: {
  children: (index: number) => JSXElement;
  itemFallback: JSXElement;
}) {
  const {visibilityRange} = useContext($VirtualizeContext)!;

  return (
    <Range start={visibilityRange.start} to={visibilityRange.end}>
      {index => {
        return createMemo(() => {
          return (
            <VirtualizeItem key={index} fallback={props.itemFallback}>
              {props.children}
            </VirtualizeItem>
          );
        });
      }}
    </Range>
  );
}
