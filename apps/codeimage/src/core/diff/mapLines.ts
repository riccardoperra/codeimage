const MAX_TABLE_SIZE = 4_000_000;

/**
 * Maps 1-based line numbers in `before` to their line in `after`. A changed
 * line maps to the first line of its replacement; a deleted line is absent.
 */
export function mapLines(before: string, after: string): Map<number, number> {
  const a = before.split('\n');
  const b = after.split('\n');
  const result = new Map<number, number>();
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    result.set(start + 1, start + 1);
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    result.set(endA, endB);
    endA--;
    endB--;
  }
  const n = endA - start;
  const m = endB - start;
  if (!n || !m || (n + 1) * (m + 1) > MAX_TABLE_SIZE) return result;

  const width = m + 1;
  const lcs = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[start + i] === b[start + j]
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }

  let deleted: number[] = [];
  let firstInserted: number | null = null;
  const closeHunk = () => {
    if (firstInserted !== null)
      for (const line of deleted) result.set(line, firstInserted);
    deleted = [];
    firstInserted = null;
  };
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[start + i] === b[start + j]) {
      closeHunk();
      result.set(start + i + 1, start + j + 1);
      i++;
      j++;
    } else if (
      j >= m ||
      (i < n && lcs[(i + 1) * width + j] >= lcs[i * width + j + 1])
    ) {
      deleted.push(start + i + 1);
      i++;
    } else {
      firstInserted ??= start + j + 1;
      j++;
    }
  }
  closeHunk();
  return result;
}
