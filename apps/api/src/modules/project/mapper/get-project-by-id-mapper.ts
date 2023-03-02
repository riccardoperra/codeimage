import * as DomainModel from '../domain';
import {ProjectCompleteResponse} from '../schema/project-get-by-id.schema';

export function createCompleteProjectGetByIdResponseMapper(
  data: DomainModel.ProjectGetByIdResponse,
): ProjectCompleteResponse {
  return {
    id: data.id,
    ownerId: data.ownerId,
    name: data.name,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    frame: {
      id: data.frame.id,
      padding: data.frame.padding,
      visible: data.frame.visible,
      background: data.frame.background ?? '',
      opacity: data.frame.opacity,
      radius: data.frame.radius ?? 0,
    },
    terminal: {
      id: data.terminal.id,
      background: data.terminal.background ?? '',
      opacity: data.terminal.opacity,
      showHeader: data.terminal.showHeader,
      showGlassReflection: data.terminal.showGlassReflection,
      showWatermark: data.terminal.showWatermark,
      textColor: data.terminal.textColor ?? '',
      type: data.terminal.type,
      accentVisible: data.terminal.accentVisible,
      alternativeTheme: data.terminal.alternativeTheme,
      shadow: data.terminal.shadow,
    },
    editorOptions: {
      id: data.editorOptions.id,
      fontWeight: data.editorOptions.fontWeight,
      fontId: data.editorOptions.fontId,
      showLineNumbers: data.editorOptions.showLineNumbers,
      themeId: data.editorOptions.themeId,
      enableLigatures: data.editorOptions.enableLigatures,
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
