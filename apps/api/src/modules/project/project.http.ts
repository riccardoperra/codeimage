import type {ProjectGetByIdResponse} from './project.contract.js';
import type {ProjectView} from './project.model.js';

export function toProjectResponse(view: ProjectView): ProjectGetByIdResponse {
  return {
    id: view.id,
    ownerId: view.ownerId,
    name: view.name,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    frame: {
      exportTarget: view.frame.exportTarget,
      aspectRatio: view.frame.aspectRatio,
      signature: view.frame.signature,
      id: view.frame.id,
      padding: view.frame.padding,
      visible: view.frame.visible,
      background: view.frame.background ?? '',
      opacity: view.frame.opacity,
      radius: view.frame.radius ?? 0,
    },
    terminal: {
      id: view.terminal.id,
      background: view.terminal.background ?? '',
      opacity: view.terminal.opacity,
      showHeader: view.terminal.showHeader,
      showGlassReflection: view.terminal.showGlassReflection,
      showWatermark: view.terminal.showWatermark,
      textColor: view.terminal.textColor ?? '',
      type: view.terminal.type,
      accentVisible: view.terminal.accentVisible,
      alternativeTheme: view.terminal.alternativeTheme,
      shadow: view.terminal.shadow,
      borderType: view.terminal.borderType,
    },
    editorOptions: {
      id: view.editorOptions.id,
      fontWeight: view.editorOptions.fontWeight,
      fontId: view.editorOptions.fontId,
      showLineNumbers: view.editorOptions.showLineNumbers,
      themeId: view.editorOptions.themeId,
      enableLigatures: view.editorOptions.enableLigatures,
    },
    editorTabs: view.editorTabs.map(editor => ({
      projectId: view.id,
      id: editor.id,
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
      lineNumberStart: editor.lineNumberStart,
      marks: editor.marks,
    })),
    isOwner: view.isOwner,
  };
}
