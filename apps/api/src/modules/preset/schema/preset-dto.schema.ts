import {Static, Type} from '@sinclair/typebox';
import {
  BaseSnippetEditorOptionsSchema,
  BaseSnippetFrameSchema,
  BaseSnippetTerminalSchema,
} from '../../project/schema/project.schema';

export const PresetDataSchema = Type.Object({
  appVersion: Type.String(),
  terminal: Type.Omit(BaseSnippetTerminalSchema, ['id']),
  frame: Type.Omit(BaseSnippetFrameSchema, ['id']),
  editor: Type.Omit(BaseSnippetEditorOptionsSchema, ['id']),
});

export const PresetDtoSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: Type.Number(),
    data: PresetDataSchema,
  },
  {
    title: 'PresetResponse',
  },
);

export type PresetDataDto = Static<typeof PresetDataSchema>;

export type PresetDto = Static<typeof PresetDtoSchema>;
