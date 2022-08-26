import {Range} from '@solid-primitives/range';
import {debounceTime, fromEvent, startWith} from 'rxjs';
import {
  Accessor,
  createContext,
  createMemo,
  FlowProps,
  JSX,
  JSXElement,
  onMount,
  Suspense,
  useContext,
} from 'solid-js';
import {createStore} from 'solid-js/store';
import MyWorker from './worker?worker';

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
    const array = new Array(props.itemCount)
      .fill(undefined)
      .map((_, index) => index);
    const groupedArray = groupArrayByN(array, props.gridCount);
    const worker = new MyWorker();

    fromEvent(worker, 'message').subscribe(evt => {
      const {start, end} = (evt as MessageEvent).data;
      if (visibilityRange.start !== start || visibilityRange.end !== end) {
        setVisibilityRange({
          start: start ?? 0,
          end: end ?? props.itemCount,
        });
      }
    });

    const notifyWorker = () => {
      worker.postMessage({
        groupedArray: groupedArray,
        height: props.height,
        scrollTop: props.scrollElement.scrollTop - props.height,
        scrollBottom:
          props.scrollElement.scrollTop +
          props.scrollElement.offsetHeight +
          props.height,
      });
    };

    fromEvent(props.scrollElement, 'scroll')
      .pipe(startWith(0), debounceTime(0))
      .subscribe(() => notifyWorker());
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
  return (
    <Suspense fallback={props.fallback}>{props.children(props.key)}</Suspense>
  );
}

export function VirtualizeList(props: {
  children: (index: number) => JSXElement;
  itemFallback: JSXElement;
}) {
  const {visibilityRange} = useContext($VirtualizeContext)!;

  return (
    <Range start={visibilityRange.start} to={visibilityRange.end}>
      {index => {
        return (
          <VirtualizeItem key={index} fallback={props.itemFallback}>
            {props.children}
          </VirtualizeItem>
        );
      }}
    </Range>
  );
}
