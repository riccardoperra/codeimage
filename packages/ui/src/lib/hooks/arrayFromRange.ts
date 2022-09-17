export const arrayFomRange = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({length}, (_, i) => start + i);
};
