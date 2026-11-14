import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import {PresetDataSchema} from '../../../src/modules/preset/preset.contract.js';
import {
  ProjectUpdateRequestSchema,
  SnippetTerminalCreateRequestSchema,
} from '../../../src/modules/project/project.contract.js';
import {
  changesFromUpdateBody,
  draftFromClone,
  draftFromCreateBody,
  readTerminalSurface,
} from '../../../src/modules/project/project.model.js';
import {toProjectResponse} from '../../../src/modules/project/project.http.js';
import {asUserId} from '../../../src/shared/principal.js';

const terminal = {
  accentVisible: true,
  alternativeTheme: false,
  background: '#123456',
  opacity: 100,
  shadow: null,
  showGlassReflection: false,
  showHeader: true,
  showWatermark: false,
  textColor: '#ffffff',
  type: 'editor',
  borderType: 'hairline',
} as const;

for (const schema of [
  SnippetTerminalCreateRequestSchema,
  ProjectUpdateRequestSchema.properties.terminal,
  PresetDataSchema.properties.terminal,
]) {
  test(`${schema.title ?? 'preset terminal'} accepts legacy surfaces, wash and hairline and rejects unknown values`, () => {
    expect(Value.Check(schema, terminal)).toBe(true);
    expect(Value.Check(schema, {...terminal, surface: null})).toBe(true);
    for (const surface of ['solid', 'wash'])
      expect(Value.Check(schema, {...terminal, surface})).toBe(true);
    expect(Value.Check(schema, {...terminal, surface: 'noise'})).toBe(false);
    expect(Value.Check(schema, {...terminal, borderType: 'thick'})).toBe(false);
  });
}

test('normalizes old database values and missing create/update fields to solid', () => {
  for (const value of [undefined, null, 'solid', 'invalid'])
    expect(readTerminalSurface(value)).toBe('solid');
  const body = {
    name: 'Window',
    terminal,
    frame: {
      background: null,
      opacity: 100,
      radius: 8,
      padding: 64,
      visible: true,
    },
    editorOptions: {
      fontId: 'mono',
      fontWeight: 400,
      showLineNumbers: false,
      themeId: 'githubDark',
      enableLigatures: true,
    },
    editors: [],
  };
  expect(draftFromCreateBody(body).terminal.surface).toBe('solid');
  expect(changesFromUpdateBody(body).terminal.surface).toBe('solid');
  const draft = draftFromCreateBody({
    ...body,
    terminal: {...terminal, surface: 'wash'},
  });
  const project = {
    ...draft,
    id: 'project',
    name: 'Window',
    ownerId: asUserId('owner'),
    createdAt: new Date(),
    updatedAt: new Date(),
    terminal: {...draft.terminal, id: 'terminal'},
    frame: {...draft.frame, id: 'frame'},
    editorOptions: {...draft.editorOptions, id: 'options'},
    editorTabs: [],
  };
  expect(draftFromClone(project, null).terminal.surface).toBe('wash');
  expect(toProjectResponse({...project, isOwner: true}).terminal).toMatchObject(
    {surface: 'wash', borderType: 'hairline'},
  );
});
