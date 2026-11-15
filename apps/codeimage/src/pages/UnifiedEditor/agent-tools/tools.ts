import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {MAX_EDITOR_TABS} from '@codeimage/store/editor/model';
import type {Accessor} from 'solid-js';
import {ExportExtension} from '../../../hooks/use-export-image';
import type {ListedModel} from '../command-menu/listed-model';
import {shownTheme} from '../command-menu/listed-model';
import type {EditorControlsModel} from '../model';
import type {EditorPageState} from '../page-state';
import type {ExportChoice} from '../shell/export-formats';
import {
  EXPORT_SCALES,
  JPEG_QUALITY,
  savedExportChoice,
} from '../shell/export-formats';
import type {ExportOutcome, Exporter} from '../shell/export';
import type {AgentControl, Parsed, TabEntry} from './values';
import {
  controlSchema,
  describeControl,
  describeOptions,
  parseControlValue,
  resolveOption,
  resolveTab,
  resolveTheme,
  unavailableReason,
} from './values';

/** Serialized for the agent as is. A failure says why in `error`. */
export type ToolResult =
  | ({readonly ok: true} & Record<string, unknown>)
  | ({readonly ok: false; readonly error: string} & Record<string, unknown>);

export interface AgentTool {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly annotations?: {readonly readOnlyHint?: boolean};
  readonly execute: (input: unknown) => Promise<ToolResult>;
}

export interface AgentToolsContext {
  readonly model: EditorControlsModel;
  readonly listed: ListedModel;
  readonly exporter: Exporter;
  readonly pageState: Accessor<EditorPageState>;
}

const fail = (error: string, extra: Record<string, unknown> = {}) =>
  ({ok: false, error, ...extra}) as const;

const NOT_EDITABLE = fail(
  'This snippet is read-only or still loading, so the editor cannot change. Read it with get_editor_state, or export it.',
);

const DELIVERIES = ['download', 'clipboard', 'new_tab'] as const;
type Delivery = (typeof DELIVERIES)[number];
const FORMATS = [
  ExportExtension.png,
  ExportExtension.jpeg,
  ExportExtension.svg,
] as const;

const oneOf =
  <T>(values: readonly T[]) =>
  (value: unknown): value is T =>
    values.some(item => item === value);
const isFormat = oneOf(FORMATS);
const isScale = oneOf(EXPORT_SCALES);
const isDelivery = oneOf(DELIVERIES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function tool(
  spec: Omit<AgentTool, 'execute'> & {
    readonly execute: (input: Record<string, unknown>) => Promise<ToolResult>;
  },
): AgentTool {
  return {
    ...spec,
    execute: async input => {
      try {
        return await spec.execute(isRecord(input) ? input : {});
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    },
  };
}

const isCssBackground = (value: string) =>
  typeof CSS !== 'undefined' && CSS.supports('background', value);

function exportMessage(outcome: ExportOutcome): ToolResult {
  switch (outcome.status) {
    case 'done':
      return {ok: true, status: 'done'};
    case 'started':
      return {
        ok: true,
        status: 'started',
        note: 'The copy runs in the background; the page shows a toast when the image is on the clipboard. Its success cannot be confirmed here.',
      };
    case 'needs-review':
      return fail(
        `The code shows ${outcome.secrets} likely secret(s). Nothing was exported: a review dialog is now open in the page. Tell the user to review it there, and to choose to redact or export anyway.`,
        {status: outcome.status, secrets: outcome.secrets},
      );
    case 'busy':
      return fail('Another export is running. Try again when it ends.', {
        status: outcome.status,
      });
    case 'not-ready':
      return fail('The editor is not ready to export yet.', {
        status: outcome.status,
      });
    case 'canceled':
      return fail('The export was canceled.', {status: outcome.status});
    case 'failed':
      return fail('The export failed. The page shows an error.', {
        status: outcome.status,
      });
  }
}

/** The settings and tabs as an agent reads them. */
export function createEditorReader(listed: ListedModel) {
  const editors = getRootEditorStore();
  const controls = listed.sections
    .flatMap(section => section.controls)
    .filter((control): control is AgentControl => control.kind !== 'custom');
  return {
    /** Every setting an agent can name, available now or not. */
    controls,
    /** The settings an agent can change now. */
    usable: () =>
      controls.filter(control => unavailableReason(control) === undefined),
    tabs: (): TabEntry[] =>
      editors.state.editors.map((editor, index) => ({
        index,
        name: editor.tab.tabName ?? '',
        language: editor.languageId,
        active: editors.isActive(editor.id),
      })),
  };
}

/**
 * Every editor action an agent can take, built from the controls model, the
 * themes and the exporter that the editor UI uses.
 */
export function createAgentTools(context: AgentToolsContext): AgentTool[] {
  const {model, listed, exporter, pageState} = context;
  const {controls: allControls, usable, tabs} = createEditorReader(listed);
  const language = () => listed.choice('editor.language');
  const active = getActiveEditorStore();
  const editors = getRootEditorStore();
  const activeTab = () => tabs().find(tab => tab.active);
  // The option key of a language id or name, checked before anything changes.
  const languageKey = (raw: unknown): Parsed<string | undefined> => {
    const control = language();
    if (raw === undefined || !control) return {ok: true, value: undefined};
    const option = resolveOption(control.options(), raw);
    return option
      ? {ok: true, value: option.key}
      : {
          ok: false,
          error: `Unknown language "${String(raw)}". Valid ids include: ${describeOptions(control.options())}.`,
        };
  };

  return [
    tool({
      name: 'get_editor_state',
      title: 'Read the CodeImage editor',
      description:
        'Read the CodeImage editor: the code of the active tab, its language, the tabs as {index, name, language, active}, the theme, every setting the agent can change with its current value and valid values, the export settings, how many likely secrets the code shows, and whether the editor can be changed. Call it first, and again to check a change.',
      inputSchema: {type: 'object', properties: {}},
      annotations: {readOnlyHint: true},
      execute: async () => {
        const choice = savedExportChoice();
        const theme = shownTheme(model);
        return {
          ok: true,
          editable: pageState().editable,
          ready: pageState().ready,
          code: active.editor()?.code ?? '',
          language: language()?.value() ?? null,
          tabs: tabs(),
          theme: theme ? {id: theme.id, name: theme.name} : null,
          controls: usable().map(describeControl),
          export: {
            format: choice.extension,
            scale: choice.pixelRatio,
            quality: choice.quality,
          },
          secrets: exporter.secrets(),
        };
      },
    }),
    tool({
      name: 'list_themes',
      title: 'List CodeImage themes',
      description:
        'List the themes that apply_theme accepts, as {id, name, dark}. A theme sets the code colors, the window and the frame background.',
      inputSchema: {type: 'object', properties: {}},
      annotations: {readOnlyHint: true},
      execute: async () => ({
        ok: true,
        themes: model.themes().map(({id, name, dark}) => ({id, name, dark})),
      }),
    }),
    tool({
      name: 'set_code',
      title: 'Set the code',
      description:
        'Replace the code of the active tab, and optionally set its language. The language is a language id or name, ignoring case, such as "typescript" or "Python". An unknown language returns an error with valid ids and changes nothing.',
      inputSchema: {
        type: 'object',
        properties: {
          code: {type: 'string', description: 'The full code to show.'},
          language: {
            type: 'string',
            description:
              'Language id or name. get_editor_state lists them under the editor.language control.',
          },
        },
        required: ['code'],
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        if (typeof input.code !== 'string')
          return fail('"code" must be a string.');
        const key = languageKey(input.language);
        if (!key.ok) return fail(key.error);
        if (key.value !== undefined) language()?.set(key.value);
        active.setCode(input.code);
        return {ok: true, language: language()?.value() ?? null};
      },
    }),
    tool({
      name: 'add_tab',
      title: 'Add a tab',
      description: `Add a tab after the others and make it the active one, optionally with its code, language (as in set_code) and name, such as "main.py". A snippet holds at most ${MAX_EDITOR_TABS} tabs. Invalid input changes nothing.`,
      inputSchema: {
        type: 'object',
        properties: {
          code: {type: 'string', description: 'The code of the new tab.'},
          language: {type: 'string', description: 'Language id or name.'},
          name: {type: 'string', description: 'The tab name.'},
        },
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        const {code, name} = input;
        if (code !== undefined && typeof code !== 'string')
          return fail('"code" must be a string.');
        if (name !== undefined && (typeof name !== 'string' || !name.trim()))
          return fail('"name" must be a non-empty string.');
        const key = languageKey(input.language);
        if (!key.ok) return fail(key.error);
        if (!editors.computed.canAddEditor())
          return fail(
            `The snippet already has ${MAX_EDITOR_TABS} tabs, the most it can hold. Pick one with select_tab and replace its code with set_code instead.`,
            {tabs: tabs()},
          );
        editors.actions.addEditor(code === undefined ? null : {code}, true);
        if (key.value !== undefined) language()?.set(key.value);
        // A name like "main.py" sets the language too, unless one was given.
        if (name !== undefined)
          editors.actions.setTabName(
            editors.state.activeEditorId,
            name.trim(),
            key.value === undefined,
          );
        return {ok: true, tab: activeTab()};
      },
    }),
    tool({
      name: 'select_tab',
      title: 'Select a tab',
      description:
        'Make a tab the active one, by its 0-based index or by its name ignoring case, as get_editor_state lists them. set_code and the language act on the active tab. An unknown tab returns an error with the tabs.',
      inputSchema: {
        type: 'object',
        properties: {
          index: {type: 'integer', minimum: 0, description: '0-based index.'},
          name: {type: 'string', description: 'The tab name.'},
        },
      },
      execute: async input => {
        const found = resolveTab(tabs(), input);
        if (!found.ok) return fail(found.error, {tabs: tabs()});
        editors.actions.setActiveEditorId(
          editors.state.editors[found.value.index].id,
        );
        return {ok: true, tab: activeTab()};
      },
    }),
    tool({
      name: 'apply_theme',
      title: 'Apply a theme',
      description:
        'Apply a theme by id or name, ignoring case, as clicking its card does: it sets the code colors, the window and the frame background. list_themes lists them. An unknown theme returns an error with close matches.',
      inputSchema: {
        type: 'object',
        properties: {
          theme: {type: 'string', description: 'Theme id or name.'},
        },
        required: ['theme'],
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        if (typeof input.theme !== 'string')
          return fail('"theme" must be a string.');
        const found = resolveTheme(model.themes(), input.theme);
        if (!found.ok)
          return fail(`Unknown theme "${input.theme}".`, {
            suggestions: found.suggestions,
          });
        found.theme.apply();
        return {ok: true, theme: {id: found.theme.id, name: found.theme.name}};
      },
    }),
    tool({
      name: 'set_controls',
      title: 'Change editor settings',
      description:
        'Change frame, window, signature, editor and font settings at once. "values" maps a setting id to its new value, in order, so {"frame.visible": true, "frame.opacity": 80} works. Choices take an option value or label, numbers must lie within their bounds, toggles take true or false. get_editor_state lists the settings with their valid values. Valid entries apply even when others fail; the result lists both.',
      inputSchema: {
        type: 'object',
        properties: {
          values: {
            type: 'object',
            properties: Object.fromEntries(
              allControls.map(control => [control.id, controlSchema(control)]),
            ),
            additionalProperties: false,
          },
        },
        required: ['values'],
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        if (!isRecord(input.values))
          return fail('"values" must map setting ids to values.');
        const applied: Record<string, unknown> = {};
        const errors: Record<string, string> = {};
        for (const [id, raw] of Object.entries(input.values)) {
          const control = allControls.find(control => control.id === id);
          if (!control) {
            errors[id] = 'Unknown setting id. get_editor_state lists them.';
            continue;
          }
          const reason = unavailableReason(control);
          if (reason) {
            errors[id] = reason;
            continue;
          }
          const parsed = parseControlValue(control, raw, isCssBackground);
          if (!parsed.ok) {
            errors[id] = parsed.error;
            continue;
          }
          parsed.value.commit();
          applied[id] = parsed.value.value;
        }
        return Object.keys(errors).length
          ? fail('Some settings were not applied.', {applied, errors})
          : {ok: true, applied};
      },
    }),
    tool({
      name: 'export_image',
      title: 'Export the image',
      description: `Export the code image and wait for the result. "delivery" is download (default), clipboard (always PNG) or new_tab. Unset fields use the export settings from get_editor_state. scale is one of ${EXPORT_SCALES.join(', ')}; quality (JPEG only) is ${JPEG_QUALITY.min} to ${JPEG_QUALITY.max}. When the code shows likely secrets, nothing is exported and a review dialog opens for the user: the result says so.`,
      inputSchema: {
        type: 'object',
        properties: {
          format: {type: 'string', enum: [...FORMATS]},
          scale: {type: 'number', enum: [...EXPORT_SCALES]},
          quality: {
            type: 'number',
            minimum: JPEG_QUALITY.min,
            maximum: JPEG_QUALITY.max,
          },
          delivery: {type: 'string', enum: [...DELIVERIES]},
        },
      },
      execute: async input => {
        const saved = savedExportChoice();
        const {format, scale, quality} = input;
        const delivery = input.delivery ?? 'download';
        if (format !== undefined && !isFormat(format))
          return fail(`"format" is one of ${FORMATS.join(', ')}.`);
        if (scale !== undefined && !isScale(scale))
          return fail(`"scale" is one of ${EXPORT_SCALES.join(', ')}.`);
        if (
          quality !== undefined &&
          (typeof quality !== 'number' ||
            quality < JPEG_QUALITY.min ||
            quality > JPEG_QUALITY.max)
        )
          return fail(
            `"quality" is a number from ${JPEG_QUALITY.min} to ${JPEG_QUALITY.max}.`,
          );
        if (!isDelivery(delivery))
          return fail(`"delivery" is one of ${DELIVERIES.join(', ')}.`);
        if (
          delivery === 'clipboard' &&
          format !== undefined &&
          format !== ExportExtension.png
        )
          return fail('The clipboard takes PNG only.');
        const choice: ExportChoice = {
          extension: format ?? saved.extension,
          pixelRatio: scale ?? saved.pixelRatio,
          quality: quality ?? saved.quality,
        };
        const run: Record<
          Delivery,
          (choice: ExportChoice) => Promise<ExportOutcome>
        > = {
          download: exporter.image,
          clipboard: exporter.copy,
          new_tab: exporter.newTab,
        };
        const result = exportMessage(await run[delivery](choice));
        return result.ok
          ? {
              ...result,
              format: delivery === 'clipboard' ? 'png' : choice.extension,
              scale: choice.pixelRatio,
              delivery,
            }
          : result;
      },
    }),
  ];
}
