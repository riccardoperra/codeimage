import * as DomainModel from '../domain';
import {ProjectCreateRequest} from '../schema';
import {
  EditorOptionsCreateRequestSchema,
  SnippetFrameCreateRequestSchema,
  SnippetTerminalCreateRequestSchema,
} from '../schema/project-create.schema';

export function createProjectRequestMapper(
  data: ProjectCreateRequest,
): DomainModel.ProjectCreateRequest {
  return {
    name: data.name,
    frame: {
      padding:
        data.frame.padding ??
        SnippetFrameCreateRequestSchema.properties.padding.default,
      visible:
        data.frame.visible ??
        SnippetFrameCreateRequestSchema.properties.visible.default,
      background: data.frame.background,
      opacity:
        data.frame.opacity ??
        SnippetFrameCreateRequestSchema.properties.opacity.default,
      radius:
        data.frame.radius ??
        SnippetFrameCreateRequestSchema.properties.radius.default,
    },
    terminal: {
      background: data.terminal.background,
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
      textColor: data.terminal.textColor,
      type: data.terminal.type,
      accentVisible:
        data.terminal.accentVisible ??
        SnippetTerminalCreateRequestSchema.properties.accentVisible.default,
      alternativeTheme:
        data.terminal.alternativeTheme ??
        SnippetTerminalCreateRequestSchema.properties.alternativeTheme.default,
      shadow: data.terminal.shadow,
    },
    editorOptions: {
      fontWeight: data.editorOptions.fontWeight,
      fontId: data.editorOptions.fontId,
      showLineNumbers:
        data.editorOptions.showLineNumbers ??
        EditorOptionsCreateRequestSchema.properties.showLineNumbers.default,
      themeId: data.editorOptions.themeId,
      enableLigatures: data.editorOptions.enableLigatures,
    },
    editors: data.editors.map(editor => ({
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
    })),
  };
}
