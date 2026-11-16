export const RENAME_FROM = `function computeTotal(items: number[]) {
    return items.reduce((sum, item) => sum + item, 0);
  }

  console.log(computeTotal([1, 2, 3]));`;
export const SHORT = `const greeting = 'hello';
  console.log(greeting);`;
export const EIGHT = Array.from(
  {length: 8},
  (_, index) => `const value${index} = ${index};`,
).join('\n');
export const LIGATURES_FROM = `const same = (a, b) => a === b;
  const ok = list.filter(x => x !== null);`;
export const LIGATURES_TO = `const same = (a: number, b: number) => a === b;
  const ok = list.filter(x => x !== null && x >= 0);`;
export const FALLBACK_FROM = `// 你好，世界 👋
  const hello = 'world';`;
export const FALLBACK_TO = `// 你好，世界 👋 こんにちは
  const hello = 'world';
  const answer = 42;`;
export const CROSS_FROM = `const total = items.length * 2;
const label = 'short';`;
export const CROSS_TO = `const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) * taxRate;
const label = 'a much longer label that pushes the code past the width of the tab header';`;
export const LONG_LINES = `${CROSS_TO} ${CROSS_TO.replace('\n', ' ')}`;
export const numbered = (rows: number, value: (index: number) => string) =>
  Array.from(
    {length: rows},
    (_, index) => `const line${index} = ${value(index)};`,
  ).join('\n');
export const grid = (rows: number) =>
  `const grid = [\n${Array.from({length: rows}, (_, row) => `  [${Array.from({length: 80}, (_, index) => (row * 7 + index) % 10).join(', ')}],`).join('\n')}\n];`;
