export const getnPage = (index: number, max: number): number => {
  console.log('index', index);
  if (index === 8 || index === 6) {
    return 0;
  }
  if (index === 9) return max;
  console.log(index + 1);
  return index + 1;
};
