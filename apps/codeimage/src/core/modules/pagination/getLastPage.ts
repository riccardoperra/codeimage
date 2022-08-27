export const getLastPage = <T>(data: T[], perPage: number) => {
  const last = Math.floor(data.length / perPage);
  return last === 0 ? 1 : last;
};
