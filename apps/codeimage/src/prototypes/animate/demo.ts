// Three steps: two of the same file, then its test, so the header variants
// have both a step that keeps the tab name and one that changes it.
export const DEMO_TABS = [
  {
    id: 'demo-user-1',
    tabName: 'user.ts',
    code: [
      'async function getUser(id: string) {',
      '  const res = await fetch(`/api/users/${id}`);',
      '  return res.json();',
      '}',
    ].join('\n'),
  },
  {
    id: 'demo-user-2',
    tabName: 'user.ts',
    code: [
      'async function getUser(id: string): Promise<User> {',
      '  const res = await fetch(`/api/users/${id}`);',
      '  if (!res.ok) throw new Error(res.statusText);',
      '  return res.json();',
      '}',
    ].join('\n'),
  },
  {
    id: 'demo-user-test',
    tabName: 'user.test.ts',
    code: [
      "test('getUser returns the user', async () => {",
      "  const user = await getUser('42');",
      "  expect(user.name).toBe('Ada');",
      '});',
    ].join('\n'),
  },
] as const;
