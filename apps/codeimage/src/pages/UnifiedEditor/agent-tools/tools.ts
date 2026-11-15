import {getEditorStore, getRootEditorStore} from '@codeimage/store/editor';
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
  settingName,
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
  readonly annotations?: {
    readonly readOnlyHint?: boolean;
    /** The result carries text the user did not write, such as code. */
    readonly untrustedContentHint?: boolean;
  };
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

/** "index.tsx" becomes "index copy.tsx"; an untitled tab stays untitled. */
export function copyName(name: string): string {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  return dot > 0
    ? `${name.slice(0, dot)} copy${name.slice(dot)}`
    : `${name} copy`;
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
function createEditorReader(listed: ListedModel) {
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
 * A short read of the editor for a small model, whose context is a few
 * thousand tokens: the tabs, the theme, each setting's value by name and the
 * theme names. get_editor_state has the rest.
 */
export function createEditorBrief(
  context: Pick<AgentToolsContext, 'model' | 'listed'>,
): () => Record<string, unknown> {
  const {model, listed} = context;
  const {usable, tabs} = createEditorReader(listed);
  return () => {
    const all = tabs();
    const active = all.find(tab => tab.active);
    return {
      tab: active ? {name: active.name, language: active.language} : null,
      tabs: all.map(tab => tab.name),
      theme: shownTheme(model)?.name ?? null,
      settings: Object.fromEntries(
        usable().map(control => [settingName(control.id), control.value()]),
      ),
      animate: getEditorStore().animation.open(),
      themes: model.themes().map(theme => theme.name),
    };
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
  // The tab a call wrote, with the editor id that outlives renames and moves.
  const writtenTab = () => ({id: editors.state.activeEditorId, ...activeTab()});
  // The option key of a language id or name, checked before anything changes.
  const languageKey = (raw: unknown): Parsed<string | undefined> => {
    const control = language();
    if (raw === undefined || !control) return {ok: true, value: undefined};
    const options = control.options();
    const option = resolveOption(options, raw);
    return option
      ? {ok: true, value: option.key}
      : {
          ok: false,
          error: `Unknown language "${String(raw)}". Valid ids include: ${describeOptions(options)}.`,
        };
  };

  return [
    tool({
      name: 'get_editor_state',
      title: 'Read the CodeImage editor',
      description:
        "Read the editor's settings, tabs, theme and export settings, and the active tab's code. Use it to check a change or to find a setting's valid values; use read_tab for one tab's code. No arguments. Example: {}. Returns {editable, code, language, tabs, theme, settings: [{name, value, options or min and max}], export, secrets}. Also for: current settings, state.",
      inputSchema: {type: 'object', properties: {}},
      annotations: {readOnlyHint: true, untrustedContentHint: true},
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
          settings: usable().map(describeControl),
          export: {
            format: choice.extension,
            scale: choice.pixelRatio,
            quality: choice.quality,
          },
          animate: getEditorStore().animation.open(),
          secrets: exporter.secrets(),
        };
      },
    }),
    tool({
      name: 'list_themes',
      title: 'List CodeImage themes',
      description:
        'List the themes apply_theme accepts. Use it only when the provided state lacks a theme name. No arguments. Example: {}. Returns {themes: [{id, name, dark}]}. Also for: themes, available themes.',
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
      description: `Replace the active tab's code, and optionally its language. Use add_tab instead to put code in a new tab. Example: {"code":"print(1)","language":"python"}. Returns {tab: {id, index, name, language, active}, language}; an unknown language changes nothing and lists valid ids. Also for: replace code, paste code.`,
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The full new code, exactly as the user wrote it.',
          },
          language: {
            type: 'string',
            description:
              'Language id or name, ignoring case, such as "python". Omitted, it stays.',
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
        return {
          ok: true,
          tab: writtenTab(),
          language: language()?.value() ?? null,
        };
      },
    }),
    tool({
      name: 'add_tab',
      title: 'Add a tab',
      description: `Create a tab after the others and make it the active one. Use set_code instead to replace the code of the active tab. Every argument is optional; at most ${MAX_EDITOR_TABS} tabs. Example: {"name":"main.py","code":"print(1)"}. Returns {tab: {id, index, name, language, active}}. Also for: new tab, new file.`,
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code of the new tab. Empty by default.',
          },
          language: {
            type: 'string',
            description:
              "Language id or name. By default the name's extension decides.",
          },
          name: {
            type: 'string',
            description:
              'The tab name, such as "main.py". Untitled by default.',
          },
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
        return {ok: true, tab: writtenTab()};
      },
    }),
    tool({
      name: 'duplicate_tab',
      title: 'Duplicate a tab',
      description: `Copy a tab, with its code and language, into a new tab after the others and make it active. Use it for any duplicate or copy request; the code is copied for you. Omit name and index to copy the active tab. At most ${MAX_EDITOR_TABS} tabs. Example: {}. Returns {tab: {id, index, name, language, active}}. Also for: duplicate, copy, clone.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The tab to copy, by name ignoring case.',
          },
          index: {
            type: 'integer',
            minimum: 0,
            description: 'The tab to copy, by 0-based position.',
          },
          newName: {
            type: 'string',
            description:
              'The copy\'s name. By default "index copy.tsx" for "index.tsx".',
          },
        },
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        const {newName} = input;
        if (
          newName !== undefined &&
          (typeof newName !== 'string' || !newName.trim())
        )
          return fail('"newName" must be a non-empty string.');
        const current = activeTab();
        const found =
          input.name === undefined && input.index === undefined && current
            ? {ok: true as const, value: current}
            : resolveTab(tabs(), input);
        if (!found.ok) return fail(found.error, {tabs: tabs()});
        if (!editors.computed.canAddEditor())
          return fail(
            `The snippet already has ${MAX_EDITOR_TABS} tabs, the most it can hold.`,
            {tabs: tabs()},
          );
        const {id: _, ...source} = editors.state.editors[found.value.index];
        editors.actions.addEditor(
          {
            ...source,
            tab: {
              ...source.tab,
              tabName:
                typeof newName === 'string'
                  ? newName.trim()
                  : copyName(source.tab.tabName ?? ''),
            },
          },
          true,
        );
        return {ok: true, tab: writtenTab()};
      },
    }),
    tool({
      name: 'select_tab',
      title: 'Select a tab',
      description:
        'Switch the visible tab, so that set_code acts on it. Use read_tab instead to only read a tab. Pass name or index. Example: {"name":"main.py"}. Returns {tab: {index, name, language, active}}; an unknown tab lists the tabs. Also for: switch, open, go to tab.',
      inputSchema: {
        type: 'object',
        properties: {
          index: {
            type: 'integer',
            minimum: 0,
            description: "The tab's 0-based position.",
          },
          name: {
            type: 'string',
            description: 'The tab name, ignoring case.',
          },
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
      name: 'read_tab',
      title: 'Read a tab',
      description: `Read a tab's code, name and language without switching tabs. Omit name and index to read the active tab; pass name or index for another one. Example: {} or {"name":"index.tsx"}. Returns {tab: {index, name, language, active}, code}; an unknown tab lists the tabs. Also for: read, show, view code.`,
      inputSchema: {
        type: 'object',
        properties: {
          index: {
            type: 'integer',
            minimum: 0,
            description: "The tab's 0-based position.",
          },
          name: {
            type: 'string',
            description: 'The tab name, ignoring case.',
          },
        },
      },
      annotations: {readOnlyHint: true, untrustedContentHint: true},
      execute: async input => {
        const current = activeTab();
        const found =
          input.name === undefined && input.index === undefined && current
            ? {ok: true as const, value: current}
            : resolveTab(tabs(), input);
        if (!found.ok) return fail(found.error, {tabs: tabs()});
        return {
          ok: true,
          tab: found.value,
          code: editors.state.editors[found.value.index].code,
        };
      },
    }),
    tool({
      name: 'apply_theme',
      title: 'Apply a theme',
      description:
        'Apply a theme: the code colors, the window and the frame background, as clicking its card does. Use it for any theme request. Example: {"theme":"Night Owl"}. Returns {theme: {id, name}}; an unknown theme lists close names. Also for: theme, color scheme, style, palette.',
      inputSchema: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            description:
              'Theme id or name, ignoring case, such as "XCode Dark".',
          },
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
        'Change frame, window, signature, editor and font settings. Use apply_theme for themes and set_code for code. Each argument is a setting name with its new value; settings left out stay as they are. Example: {"frame_padding":"64","window_header":false}. Returns {applied}; invalid settings come back in errors while the valid ones still apply. Also for: padding, margin, radius, corners, shadow, background, font, line numbers.',
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          allControls.map(control => [
            settingName(control.id),
            controlSchema(control),
          ]),
        ),
        additionalProperties: false,
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        const entries = Object.entries(input);
        if (entries.length === 0)
          return fail(
            'Pass at least one setting, such as {"frame_padding": "64"}. get_editor_state lists them.',
          );
        const applied: Record<string, unknown> = {};
        const errors: Record<string, string> = {};
        for (const [name, raw] of entries) {
          const control = allControls.find(
            control => settingName(control.id) === name,
          );
          if (!control) {
            errors[name] = 'Unknown setting. get_editor_state lists them.';
            continue;
          }
          const reason = unavailableReason(control);
          if (reason) {
            errors[name] = reason;
            continue;
          }
          const parsed = parseControlValue(control, raw, isCssBackground);
          if (!parsed.ok) {
            errors[name] = parsed.error;
            continue;
          }
          parsed.value.commit();
          applied[name] = parsed.value.value;
        }
        return Object.keys(errors).length
          ? fail('Some settings were not applied.', {applied, errors})
          : {ok: true, applied};
      },
    }),
    tool({
      name: 'set_animate_mode',
      title: 'Turn Animate mode on or off',
      description:
        'Show or hide the Animate panel, to build a code animation, as the toolbar\'s Animate button does. Setting the current state again changes nothing. Example: {"open":true}. Returns {open}. Also for: animate, animation, record, recording, video.',
      inputSchema: {
        type: 'object',
        properties: {
          open: {
            type: 'boolean',
            description: 'true shows the Animate panel, false hides it.',
          },
        },
        required: ['open'],
      },
      execute: async input => {
        if (!pageState().editable) return NOT_EDITABLE;
        if (typeof input.open !== 'boolean')
          return fail('"open" must be true or false.');
        const {animation} = getEditorStore();
        animation.actions.setOpen(input.open);
        return {ok: true, open: animation.open()};
      },
    }),
    tool({
      name: 'export_image',
      title: 'Export the image',
      description:
        'Export the code image, only when the user asks for it. Every argument is optional; unset ones use the saved export settings. Example: {"format":"png","scale":2}. Returns {status, format, scale, delivery}; when the code shows likely secrets nothing is exported and the user sees a review dialog. Also for: export, save, download, screenshot, image, png.',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: [...FORMATS],
            description: 'The image format.',
          },
          scale: {
            type: 'number',
            enum: [...EXPORT_SCALES],
            description: 'The pixel ratio.',
          },
          quality: {
            type: 'number',
            minimum: JPEG_QUALITY.min,
            maximum: JPEG_QUALITY.max,
            description: 'JPEG quality.',
          },
          delivery: {
            type: 'string',
            enum: [...DELIVERIES],
            description:
              'download (the default), clipboard (PNG only) or new_tab.',
          },
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
