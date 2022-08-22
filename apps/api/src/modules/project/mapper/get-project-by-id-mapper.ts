import {ProjectGetByIdResponse} from '../schema';
import * as DomainModel from '../domain';
import {
  EditorOptionsCreateRequestSchema,
  SnippetFrameCreateRequestSchema,
  SnippetTerminalCreateRequestSchema,
} from '../schema/project-create.schema';

export function createProjectGetByIdResponseMapper(
  data: DomainModel.ProjectGetByIdResponse,
): ProjectGetByIdResponse {
  return {
    id: data.id,
    ownerId: data.ownerId,
    name: data.name,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    frame: {
      id: data.frame.id,
      padding:
        data.frame.padding ??
        SnippetFrameCreateRequestSchema.properties.padding.default,
      visible:
        data.frame.visible ??
        SnippetFrameCreateRequestSchema.properties.visible.default,
      background: data.frame.background ?? '',
      opacity:
        data.frame.opacity ??
        SnippetFrameCreateRequestSchema.properties.opacity.default,
      radius:
        data.frame.radius ??
        SnippetFrameCreateRequestSchema.properties.radius.default,
    },
    terminal: {
      id: data.terminal.id,
      background: data.terminal.background ?? '',
      opacity:
        data.terminal.opacity ??
        SnippetTerminalCreateRequestSchema.properties.opacity.default,
      showHeader: data.terminal.showHeader,
      showGlassReflection:
        data.terminal.showGlassReflection ??
        SnippetTerminalCreateRequestSchema.properties.showGlassReflection
          .default,
      showWatermark:
        data.terminal.showWatermark ??
        SnippetTerminalCreateRequestSchema.properties.showWatermark.default,
      textColor: data.terminal.textColor ?? '',
      type: data.terminal.type,
      accentVisible:
        data.terminal.accentVisible ??
        SnippetTerminalCreateRequestSchema.properties.accentVisible.default,
      alternativeTheme:
        data.terminal.alternativeTheme ??
        SnippetTerminalCreateRequestSchema.properties.alternativeTheme.default,
      shadow: data.terminal.shadow ?? null,
    },
    editorOptions: {
      id: data.editorOptions.id,
      fontWeight: data.editorOptions.fontWeight,
      fontId: data.editorOptions.fontId,
      showLineNumbers:
        data.editorOptions.showLineNumbers ??
        EditorOptionsCreateRequestSchema.properties.showLineNumbers.default,
      themeId: data.editorOptions.themeId,
    },
    editorTabs: data.editorTabs.map(editor => ({
      projectId: data.id,
      id: editor.id,
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
    })),
    isOwner: false,
  };
}
