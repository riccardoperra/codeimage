/**
 * Project persistence. The ownership invariant lives here, in the shape of the API:
 *
 *   createProjectRepository(db)
 *     .findById(id)              shared-link read, read-only by design
 *     .ownedBy(owner: UserId)    the ONLY handle with writes; every write keys on `id_ownerId`
 *
 * There is no method that writes a project without an owner. A caller that forgot the owner scope
 * does not compile: `update` simply does not exist outside `ownedBy`. This is the fix for today's
 * `updateProject` / `updateProjectName`, which updated `where: {id}`.
 *
 * Rows are parsed into domain types here (`toProject`). Prisma types do not leave this file.
 */
import type {
  Project as ProjectRow,
  SnippetEditorOptions as EditorOptionsRow,
  SnippetEditorTab as EditorTabRow,
  SnippetFrame as FrameRow,
  SnippetTerminal as TerminalRow,
} from '@codeimage/prisma-models';
import {type Db, orNull} from '../../shared/db.js';
import {asUserId, type UserId} from '../../shared/principal.js';
import type {
  Project,
  ProjectChanges,
  ProjectDraft,
  ProjectHeader,
  ProjectSummary,
} from './project.model.js';

const fullProject = {
  frame: true,
  terminal: true,
  editorOptions: true,
  editorTabs: true,
} as const;

export function createProjectRepository(db: Db) {
  return {
    /**
     * Any project by id, whoever owns it. Projects are shareable by link (#325), so this read is not
     * owner-scoped. Keep this object free of writes: an unscoped write here would bypass ownership.
     */
    async findById(id: string): Promise<Project | null> {
      const row = await db.project.findFirst({where: {id}, include: fullProject});
      return row ? toProject(row) : null;
    },

    ownedBy(owner: UserId) {
      const ownedId = (id: string) => ({id_ownerId: {id, ownerId: owner}});
      return {
        /**
         * Today's query: newest first, every scalar column (the three foreign keys included), tabs
         * reduced to languageId and tabName.
         */
        async list(): Promise<ProjectSummary[]> {
          throw new Error('not implemented');
        },

        /**
         * One nested create (atomic in Prisma). Persists `editorOptions.enableLigatures`, which
         * today's createNewProject drops so the DB default `true` always wins.
         */
        async create(draft: ProjectDraft): Promise<Project> {
          void draft;
          throw new Error('not implemented');
        },

        /**
         * Full replace, keyed on `id_ownerId`. null when the project does not exist or is not the
         * owner's: both look the same to the caller (404), which leaks nothing about foreign ids.
         */
        async update(id: string, changes: ProjectChanges): Promise<Project | null> {
          // TODO: today's updateProject body with `where: ownedId(id)` instead of `where: {id}`:
          //   editorTabs: {deleteMany: {NOT: {id: {in: changes.editorTabs.map(t => t.id)}}},
          //                upsert: changes.editorTabs.map(tab => ({where: {id: tab.id}, create: ..., update: ...}))},
          //   editorOptions/frame/terminal: {update: changes.*}
          // wrapped in orNull(...) so a P2025 becomes null.
          void [id, changes, ownedId, orNull];
          throw new Error('not implemented');
        },

        async updateName(id: string, name: string): Promise<ProjectHeader | null> {
          const row = await orNull(
            db.project.update({where: ownedId(id), data: {name}}),
          );
          return row ? toHeader(row) : null;
        },

        /** Was a raw P2025 → 500 for a missing or foreign id. Now null → 404 in the service. */
        async remove(id: string): Promise<ProjectHeader | null> {
          const row = await orNull(db.project.delete({where: ownedId(id)}));
          return row ? toHeader(row) : null;
        },
      };
    },
  };
}

export type ProjectRepository = ReturnType<typeof createProjectRepository>;

function toHeader(row: ProjectRow): ProjectHeader {
  return {
    id: row.id,
    ownerId: asUserId(row.ownerId),
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProject(
  row: ProjectRow & {
    frame: FrameRow;
    terminal: TerminalRow;
    editorOptions: EditorOptionsRow;
    editorTabs: EditorTabRow[];
  },
): Project {
  // TODO: {...toHeader(row), frame: {id, background, padding, radius, visible, opacity}, terminal: {...},
  // editorOptions: {...}, editorTabs: row.editorTabs.map(tab => ({id, projectId, code, languageId, tabName, lineNumberStart}))}
  // List fields explicitly rather than spreading rows: a new column (P5's `marks Json?`) reaches the
  // domain only when the model declares it, and parsing its Json into a typed value happens here.
  void [row, toHeader];
  throw new Error('not implemented');
}
