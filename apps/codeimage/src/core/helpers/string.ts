export const toTitleCase = (str: string) => {
  return str.replace(/(^|\s)\S/g, t => t.toUpperCase());
};
