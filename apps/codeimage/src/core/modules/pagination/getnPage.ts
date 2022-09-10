export const arrayFomRange = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({length}, (_, i) => start + i);
};

export const getNPages = (start: number, max: number) => {
  const pages = arrayFomRange(start, start + 9);
  const pagesTo = pages.map((p, i) => {
    if (i === 3 || i === 5) {
      return '...';
    }
    if (i === 9) {
      return max;
    }
    return p;
  });
  return pagesTo;
};
