import {arrayFomRange} from '@core/modules/pagination/getnPage';
import {Accessor, Setter} from 'solid-js';
export const usePaginationButtons = (
  maxValue: Accessor<number>,
  selectedPage: Accessor<number>,
  onChange: () => Setter<number>,
  disabled: boolean,
) => {
  // const count = 1;
  const boundaryCount = 1;
  const siblingCount = 1;
  const buttonsQuantity = siblingCount * 2 + boundaryCount * 2 + 1 + 2;

  const startPages = arrayFomRange(1, buttonsQuantity - 2);
  const endPages = arrayFomRange(maxValue() - buttonsQuantity + 3, maxValue());

  // const siblingsStart = Math.max(
  //   Math.min(
  //     // Natural start
  //     page - siblingCount,
  //     // Lower boundary when page is high
  //     count - boundaryCount - siblingCount * 2 - 1,
  //   ),
  //   // Greater than startPages
  //   boundaryCount + 2,
  // );

  // const siblingsEnd = Math.min(
  //   Math.max(
  //     // Natural end
  //     page + siblingCount,
  //     // Upper boundary when page is low
  //     boundaryCount + siblingCount * 2 + 2,
  //   ),
  //   // Less than endPages
  //   endPages.length > 0 ? endPages[0] - 2 : count - 1,
  // );
  const buttons = arrayFomRange(1, buttonsQuantity);
  const itemList = [...startPages, '...', maxValue()];
  console.log('buttons', {
    // siblingsStart,
    // siblingsEnd,
    startPages,
    endPages,
    length: endPages.length,
    buttons,
    itemList,
    selectedPage: selectedPage(),
  });
  const items: buttonPaginationProps[] = itemList.map(item => {
    return typeof item === 'number'
      ? {
          value: item,
          selected: item === selectedPage(),
          disabled,
          onClick: onChange(),
        }
      : {
          value: item,
          selected: false,
          disabled: item === '...',
          onClick: onChange(),
        };
  });
  return items;
};
export type buttonPaginationProps = {
  onClick: Setter<number>;
  value: number | string;
  selected: boolean;
};
