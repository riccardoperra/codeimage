import * as DomainModel from '../domain';
import {ProjectCreateRequest} from '../schema';

export function createProjectRequestMapper(
  data: ProjectCreateRequest,
): DomainModel.ProjectCreateRequest {
  return {
    name: data.name,
    frame: {
      padding: data.frame.padding ?? 32,
      visible: data.frame.visible ?? true,
      background: data.frame.background,
      opacity: data.frame.opacity ?? 100,
      radius: data.frame.radius,
    },
    terminal: {
      background: data.terminal.background,
      opacity: data.terminal.opacity ?? 100,
      showHeader: data.terminal.showHeader ?? false,
      showGlassReflection: data.terminal.showGlassReflection ?? false,
      showWatermark: data.terminal.showWatermark ?? true,
      textColor: data.terminal.textColor,
      type: data.terminal.type,
      accentVisible: data.terminal.accentVisible ?? false,
      alternativeTheme: data.terminal.alternativeTheme ?? false,
      shadow: data.terminal.shadow,
    },
    editorOptions: {
      fontWeight: data.editorOptions.fontWeight ?? 400,
      fontId: data.editorOptions.fontId,
      showLineNumbers: data.editorOptions.showLineNumbers ?? false,
      themeId: data.editorOptions.themeId,
    },
    editors: data.editors.map(editor => ({
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
    })),
  };
}
