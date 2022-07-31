// import {
//   PrismaClient,
//   Project,
//   SnippetEditorOptions,
//   SnippetEditorTab,
//   SnippetFrame,
//   SnippetTerminal,
// } from '@codeimage/prisma-models';
//
// type IdAndSnippetId = 'id' | 'snippetId';
//
// export interface ProjectCreateRequest {
//   name: Project['name'];
//   editorOptions: Omit<SnippetEditorOptions, IdAndSnippetId>;
//   terminal: Omit<SnippetTerminal, IdAndSnippetId>;
//   frame: Omit<SnippetFrame, IdAndSnippetId>;
//   editors: Omit<SnippetEditorTab, IdAndSnippetId>[];
// }
//
// export type ProjectCreateResponse = Project & {
//   editorOptions: SnippetEditorOptions | null;
//   terminal: SnippetTerminal | null;
//   frame: SnippetFrame | null;
//   editorTabs: SnippetEditorTab[];
// };
//
// export type CreateProjectHandler = (
//   projectModel: PrismaClient['project'],
//   data: ProjectCreateRequest,
//   userId: string,
// ) => Promise<ProjectCreateResponse>;
//
// export const createProject: CreateProjectHandler = (
//   projectModel,
//   data,
//   userId,
// ) => {
//   return projectModel.create({
//     data: {
//       name: 'Untitled',
//       userId,
//       editorOptions: {
//         create: {
//           fontId: data.editorOptions.fontId,
//           fontWeight: data.editorOptions.fontWeight,
//           showLineNumbers: data.editorOptions.showLineNumbers,
//           themeId: data.editorOptions.themeId,
//         },
//       },
//       editorTabs: {
//         createMany: {
//           data: data.editors,
//         },
//       },
//       frame: {
//         create: {
//           background: data.frame.background,
//           opacity: data.frame.opacity,
//           radius: data.frame.radius,
//           padding: data.frame.padding,
//           visible: data.frame.visible,
//         },
//       },
//       terminal: {
//         create: {
//           accentVisible: data.terminal.accentVisible,
//           alternativeTheme: data.terminal.alternativeTheme,
//           background: data.terminal.background,
//           opacity: data.terminal.opacity,
//           shadow: data.terminal.shadow,
//           showGlassReflection: data.terminal.showGlassReflection,
//           showHeader: data.terminal.showHeader,
//           showWatermark: data.terminal.showWatermark,
//           textColor: data.terminal.textColor,
//           type: data.terminal.type,
//         },
//       },
//     },
//     include: {
//       editorOptions: true,
//       editorTabs: true,
//       frame: true,
//       terminal: true,
//     },
//   });
// };

import fp from 'fastify-plugin';

export default fp(async () => {
  void 0;
});
