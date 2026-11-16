import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import {parseTabMarks} from '../../../../src/modules/project/project.model.js';
import {TabMarksSchema} from '../../../../src/modules/project/project.contract.js';
import {SnippetEditorTabsCreateRequestSchema} from '../../../../src/modules/project/project.contract.js';
import {SnippetEditorTabsUpdateRequestSchema} from '../../../../src/modules/project/project.contract.js';

const marks = {
  lines: [
    {line: 3, kind: 'added'},
    {line: 5, kind: 'highlight'},
  ],
  focusedLines: [2],
};
const tab = {
  id: 'tab',
  code: 'code',
  tabName: 'file.ts',
  languageId: 'typescript',
  lineNumberStart: 1,
};

test('accepts marks in create and update requests', () => {
  expect(
    Value.Check(SnippetEditorTabsCreateRequestSchema, [{...tab, marks}]),
  ).toBe(true);
  expect(
    Value.Check(SnippetEditorTabsUpdateRequestSchema, [{...tab, marks}]),
  ).toBe(true);
  expect(parseTabMarks(marks)).toEqual(marks);
});

test('keeps requests without marks compatible and restores null database values', () => {
  expect(Value.Check(SnippetEditorTabsCreateRequestSchema, [tab])).toBe(true);
  expect(
    Value.Check(SnippetEditorTabsUpdateRequestSchema, [{...tab, marks: null}]),
  ).toBe(true);
  expect(parseTabMarks(null)).toEqual({lines: [], focusedLines: []});
  expect(parseTabMarks(undefined)).toEqual({lines: [], focusedLines: []});
});

test('rejects invalid kinds and line numbers at the API boundary', () => {
  for (const invalid of [
    {line: 0, kind: 'added'},
    {line: 1.5, kind: 'added'},
    {line: 1, kind: 'unknown'},
  ]) {
    expect(
      Value.Check(TabMarksSchema, {lines: [invalid], focusedLines: []}),
    ).toBe(false);
    expect(parseTabMarks({lines: [invalid], focusedLines: []})).toEqual({
      lines: [],
      focusedLines: [],
    });
  }
});

test('rejects invalid focused line numbers', () => {
  for (const focusedLines of [[0], [-1], [1.5], ['2']]) {
    expect(Value.Check(TabMarksSchema, {lines: [], focusedLines})).toBe(false);
  }
});

test('round-trips every mark kind and additive focus through the persisted JSON schema', () => {
  const snapshot = {
    lines: [
      {line: 1, kind: 'removed'},
      {line: 2, kind: 'added'},
      {line: 3, kind: 'highlight'},
    ],
    focusedLines: [2, 4],
  };
  const restored = parseTabMarks(JSON.parse(JSON.stringify(snapshot)));
  expect(Value.Check(TabMarksSchema, restored)).toBe(true);
  expect(restored).toEqual(snapshot);
  expect(Object.keys(restored)).toEqual(['lines', 'focusedLines']);
});

test('script ranges are validated and survive the JSON boundary', () => {
  const script = {
    steps: ['one', 'two', 'three'],
    lines: [{line: 1, enter: 2, leave: 3, focus: [2]}],
  };
  const value = {...marks, script};
  expect(parseTabMarks(JSON.parse(JSON.stringify(value)))).toEqual(value);
  for (const lines of [
    [{line: 1, enter: 2, leave: 2}],
    [{line: 1, enter: 4}],
    [{line: 1, leave: 4}],
    [{line: 1, focus: [4]}],
    [{line: 1}, {line: 1}],
  ]) {
    expect(parseTabMarks({...marks, script: {...script, lines}})).toEqual(
      marks,
    );
  }
  for (const invalid of [
    {...script, steps: ['one']},
    {...script, steps: ['one', 'one']},
    {...script, lines: [{line: 1, enter: 1.5}]},
  ]) {
    expect(Value.Check(TabMarksSchema, {...marks, script: invalid})).toBe(
      false,
    );
  }
});
