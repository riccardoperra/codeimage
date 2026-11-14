import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import {parseTabMarks, TabMarksSchema} from '../../../../src/schemas/marks.js';
import {SnippetEditorTabsCreateRequestSchema} from '../../../../src/modules/project/project.contract.js';
import {SnippetEditorTabsUpdateRequestSchema} from '../../../../src/modules/project/project.contract.js';

const marks = {
  lines: [
    {line: 3, kind: 'added'},
    {line: 5, kind: 'highlight'},
  ],
  focus: true,
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
  expect(parseTabMarks(null)).toEqual({lines: [], focus: false});
  expect(parseTabMarks(undefined)).toEqual({lines: [], focus: false});
});

test('rejects invalid kinds and line numbers at the API boundary', () => {
  for (const invalid of [
    {line: 0, kind: 'added'},
    {line: 1.5, kind: 'added'},
    {line: 1, kind: 'unknown'},
  ]) {
    expect(Value.Check(TabMarksSchema, {lines: [invalid], focus: false})).toBe(
      false,
    );
    expect(parseTabMarks({lines: [invalid], focus: false})).toEqual({
      lines: [],
      focus: false,
    });
  }
});
