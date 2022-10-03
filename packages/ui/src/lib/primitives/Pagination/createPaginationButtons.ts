/**
 * Portions of this file are based on code from @material-ui/react.
 * MIT Licensed, Copyright (c) 2014 Call-Em-All.
 *
 * Credits to the Material UI team:
 * https://github.com/mui/material-ui/blob/master/packages/mui-material/src/usePagination/usePagination.js
 */
import {Accessor, mapArray, Setter} from 'solid-js';
import {arrayFomRange} from '../../hooks/arrayFromRange';

/**
 *  This hook allow us to create a list of props to render buttons of our pagination component
 * @param lastPage Accessor that return number of the lastPage of paginations Button
 * @param selectedPage Accessor that return number of the pageSelected
 * @param onChange callback that allow change page
 * @param disabled boolean that
 * @returns the list of the props buttons
 *
 *
 * @examples
 */
export const createPaginationButtons = (
  lastPage: Accessor<number>,
  selectedPage: Accessor<number>,
  onChange: Setter<number>,
  disabled: boolean,
) => {
  const boundaryCount = 1;
  const siblingCount = 1;

  const startPages = () =>
    arrayFomRange(1, Math.min(boundaryCount, selectedPage()));
  const endPages = () =>
    arrayFomRange(
      Math.max(lastPage() - boundaryCount + 1, boundaryCount + 1),
      lastPage(),
    );

  const siblingsStart = () =>
    Math.max(
      Math.min(
        // Natural start
        selectedPage() - siblingCount,
        // Lower boundary when page is high
        lastPage() - boundaryCount - siblingCount * 2 - 1,
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
      endPages().length > 0 ? endPages()[0] - 2 : lastPage() - 1,
    );
  const itemList = () => [
    ...startPages(),

    // Start ellipsis
    // eslint-disable-next-line no-nested-ternary
    ...(siblingsStart() > boundaryCount + 2
      ? ['start-ellipsis']
      : boundaryCount + 1 < lastPage() - boundaryCount
      ? [boundaryCount + 1]
      : []),

    // Sibling pages
    ...arrayFomRange(siblingsStart(), siblingsEnd()),

    // End ellipsis
    // eslint-disable-next-line no-nested-ternary
    ...(siblingsEnd() < lastPage() - boundaryCount - 1
      ? ['end-ellipsis']
      : lastPage() - boundaryCount > boundaryCount
      ? [lastPage() - boundaryCount]
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

export type ButtonPaginationProps = {
  onClick?: Setter<number | string>;
  value: number | string;
  selected: boolean;
};
