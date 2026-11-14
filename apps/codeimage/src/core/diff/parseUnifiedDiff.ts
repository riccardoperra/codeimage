import type {LineMark, TabMarks} from '../../state/editor/model';

export interface DiffFile {
  path: string;
  code: string;
  marks: TabMarks;
}

/** Parse text hunks only. Binary patches and metadata never become source code. */
export function parseUnifiedDiff(input: string): DiffFile[] {
  const files: DiffFile[] = [];
  let path = '';
  let oldPath = '';
  let code: string[] = [];
  let marks: LineMark[] = [];
  let remainingOld = 0;
  let remainingNew = 0;
  let hasHunk = false;
  let trailingNewline = true;
  const finish = () => {
    if (hasHunk && path) {
      files.push({
        path,
        code: code.join('\n') + (trailingNewline && code.length ? '\n' : ''),
        marks: {lines: marks, focus: false},
      });
    }
    code = [];
    marks = [];
    hasHunk = false;
    remainingOld = remainingNew = 0;
    trailingNewline = true;
  };
  const filePath = (value: string) => {
    const name = value.split('\t')[0];
    try {
      const unquoted: unknown = name.startsWith('"') ? JSON.parse(name) : name;
      return typeof unquoted === 'string'
        ? unquoted.replace(/^[ab]\//, '')
        : name;
    } catch {
      return name.replace(/^[ab]\//, '');
    }
  };
  const source = input.replace(/\r\n/g, '\n').split('\n');
  if (source.at(-1) === '') source.pop();
  for (const line of source) {
    if (line === '\\ No newline at end of file') {
      trailingNewline = false;
      continue;
    }
    if (remainingOld || remainingNew) {
      let prefix = line[0];
      let content = line.slice(1);
      if (prefix === ' ' && remainingOld && remainingNew) {
        remainingOld--;
        remainingNew--;
      } else if (prefix === '-' && remainingOld) {
        remainingOld--;
      } else if (prefix === '+' && remainingNew) {
        remainingNew--;
      } else if (remainingOld && remainingNew) {
        // Some clipboard sources strip the context prefix, including on empty lines.
        prefix = ' ';
        content = line;
        remainingOld--;
        remainingNew--;
      } else {
        // Reject truncated or malformed patches instead of offering a lossy import.
        return [];
      }
      code.push(content);
      if (prefix === '+' || prefix === '-') {
        marks.push({
          line: code.length,
          kind: prefix === '+' ? 'added' : 'removed',
        });
      }
      trailingNewline = true;
      continue;
    }
    if (line.startsWith('diff --git ')) {
      finish();
      path = oldPath = '';
    } else if (line.startsWith('--- ')) {
      if (hasHunk) finish();
      oldPath = filePath(line.slice(4));
    } else if (line.startsWith('+++ ')) {
      path = filePath(line.slice(4));
      if (path === '/dev/null') path = oldPath;
    } else {
      const hunk = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(line);
      if (hunk && path) {
        hasHunk = true;
        remainingOld = Number(hunk[1] ?? 1);
        remainingNew = Number(hunk[2] ?? 1);
      }
    }
  }
  if (remainingOld || remainingNew) return [];
  finish();
  return files;
}
