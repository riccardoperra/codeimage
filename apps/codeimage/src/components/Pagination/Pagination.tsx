import {Box, IconButton} from '@codeimage/ui';
import {getnPage} from '@core/modules/pagination';
import {
  createEffect,
  createSignal,
  For,
  mergeProps,
  ParentProps,
} from 'solid-js';
import Page from './page';

export interface PaginationProps {
  /**
   * The current value (controlled).
   */
  value?: number;
  /**
   * The default value (uncontrolled).
   */
  defaultValue?: number;
  /**
   * Handler that is called when the value changes.
   */
  onChange: (value: number) => void;
  maxValue?: number;
  onPrevious?: (value: number, e: Event) => void;
  onNext?: (value: number, e: Event) => void;
}

const Pagination = (props: ParentProps<PaginationProps>) => {
  const merged = mergeProps(
    {value: 1, maxValue: 1} as Required<PaginationProps>,
    props,
  );
  const [buttons, setButtons] = createSignal<number[] | null>(null);
  const handleNext = () => {
    if (merged.value && merged.value > 1) {
      props.onChange(merged.value - 1);
    }
  };
  const handlePrev = () => {
    if (merged.value && merged.value < merged.maxValue) {
      props.onChange(merged.value + 1);
    }
  };

  createEffect(() => {
    const array: number[] = new Array(10).fill(1);
    setButtons(array.map((n, i) => getnPage(i, merged.maxValue)));
  });
  return (
    <Box display={'flex'} flexDirection="column" style={{color: 'white'}}>
      <Box display={'flex'} gap={2}>
        <IconButton onClick={handleNext}>{'<'}</IconButton>
        <For each={buttons()}>
          {page => (
            <Page
              value={page}
              onChange={props.onChange}
              active={merged.value === page}
            />
          )}
        </For>
        <IconButton onclick={handlePrev}>{'>'}</IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
