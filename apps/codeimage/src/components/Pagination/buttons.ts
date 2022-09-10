import {arrayFomRange} from '@core/modules/pagination/getnPage';
import {Accessor, indexArray, mapArray, Setter} from 'solid-js';
export const usePaginationButtons = (
  maxValue: Accessor<number>,
  selectedPage: Accessor<number>,
  onChange: Setter<number>,
  disabled: boolean,
) => {
  // const count = 1;
  const boundaryCount = 1;
  const siblingCount = 1;
  // const buttonsQuantity = siblingCount * 2 + boundaryCount * 2 + 1 + 2;

  // const startPages = range(1, Math.min(boundaryCount, count));
  // const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const startPages = () =>
    arrayFomRange(1, Math.min(boundaryCount, selectedPage()));
  const endPages = () =>
    arrayFomRange(
      Math.max(maxValue() - boundaryCount + 1, boundaryCount + 1),
      maxValue(),
    );

  const siblingsStart = () =>
    Math.max(
      Math.min(
        // Natural start
        selectedPage() - siblingCount,
        // Lower boundary when page is high
        maxValue() - boundaryCount - siblingCount * 2 - 1,
      ),
      // Greater than startPages
      boundaryCount + 2,
    );

  const siblingsEnd = () =>
    Math.min(
      Math.max(
        // Natural end
        selectedPage() + siblingCount,
        // Upper boundary when page is low
        boundaryCount + siblingCount * 2 + 2,
      ),
      // Less than endPages
      endPages().length > 0 ? endPages()[0] - 2 : maxValue() - 1,
    );

  // const buttons = arrayFomRange(1, buttonsQuantity);
  // const itemList = () => [...startPages, '...', maxValue()];
  // console.log('buttons', {
  //   siblingsStart(),
  //   siblingsEnd,
  //   startPages,
  //   endPages,
  //   length: endPages.length,
  //   buttons,
  //   itemList,
  //   selectedPage: selectedPage(),
  // });
  // mapArray
  const itemList = () => [
    ...startPages(),

    // Start ellipsis
    // eslint-disable-next-line no-nested-ternary
    ...(siblingsStart() > boundaryCount + 2
      ? ['start-ellipsis']
      : boundaryCount + 1 < maxValue() - boundaryCount
      ? [boundaryCount + 1]
      : []),

    // Sibling pages
    ...arrayFomRange(siblingsStart(), siblingsEnd()),

    // End ellipsis
    // eslint-disable-next-line no-nested-ternary
    ...(siblingsEnd() < maxValue() - boundaryCount - 1
      ? ['end-ellipsis']
      : maxValue() - boundaryCount > boundaryCount
      ? [maxValue() - boundaryCount]
      : []),

    ...endPages(),
  ];
  const items = mapArray(itemList, item => {
    return typeof item === 'number'
      ? {
          get value() {
            return item;
          },
          get selected() {
            return item === selectedPage();
          },
          disabled,
          onClick: onChange,
        }
      : {
          get value() {
            return '...';
          },
          selected: false,
          get disabled() {
            return item === '...';
          },
        };
  });
  return items;
};
export type buttonPaginationProps = {
  onClick?: Setter<number | string>;
  value: number | string;
  selected: boolean;
};
