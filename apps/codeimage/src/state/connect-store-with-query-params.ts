import {editor$, updateEditorStore} from '@codeimage/store/editor';
import {frame$, updateFrameStore} from '@codeimage/store/frame';
import {terminal$, updateTerminalStore} from '@codeimage/store/terminal';
import {Store, StoreValue} from '@ngneat/elf';
import {parse, stringify} from 'query-string';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  skip,
} from 'rxjs';
import {onMount} from 'solid-js';
import shallow from '../core/helpers/shallow';

function getFromQuery<S extends Store>(
  key: string,
): Partial<StoreValue<S>> | null {
  const parsedQuery = parse(window.location.search, {
    parseBooleans: true,
    parseNumbers: true,
    decode: true,
    parseFragmentIdentifier: true,
  });

  const allowedEntries = Object.entries(parsedQuery)
    .filter(([k]) => k.includes(`${key}_`))
    .map(([k]) => k.replace(`${key}_`, ''));

  if (allowedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(parsedQuery)
      .filter(([k]) => k.includes(`${key}_`))
      .map(([k, v]) => [k.replace(`${key}_`, ''), v] as [string, string]),
  ) as Partial<StoreValue<S>>;
}

function setQuery<S extends Store>(
  params: URLSearchParams,
  key: string,
  value: Partial<StoreValue<S>>,
) {
  const objectToStringify = Object.fromEntries(
    Object.entries(value).filter(
      ([, value]) =>
        value !== undefined && value !== null && typeof value !== 'object',
    ),
  );

  const query = stringify(objectToStringify);
  const parsedQuery = parse(query);

  Object.entries(parsedQuery).forEach(([k, v]) =>
    params.set(`${key}_${k}`, v as string),
  );
}

export function connectStoreWithQueryParams() {
  const terminalState$ = terminal$.pipe(
    map(terminal => ({
      showHeader: terminal.showHeader,
      type: terminal.type,
      tabName: terminal.tabName,
      accentVisible: terminal.accentVisible,
      // shadow: terminal.shadow,
      background: terminal.background,
      textColor: terminal.textColor,
      darkMode: terminal.darkMode,
      showWatermark: terminal.showWatermark,
      showReflection: terminal.showGlassReflection,
    })),
  );

  const frameState$ = frame$.pipe(
    map(frame => ({
      background: frame.background,
      padding: frame.padding,
      radius: frame.radius,
      visible: frame.visible,
      opacity: frame.opacity,
    })),
  );

  const editorState$ = editor$.pipe(
    map(editor => ({
      code: editor.code,
      languageId: editor.languageId,
      themeId: editor.themeId,
      showLineNumbers: editor.showLineNumbers,
      fontId: editor.fontId,
    })),
  );

  onMount(() => {
    const terminalQuery = getFromQuery('terminal');
    const editorQuery = getFromQuery('editor');
    const frameQuery = getFromQuery('frame');

    if (terminalQuery) {
      updateTerminalStore(state => ({...state, ...terminalQuery}));
    }
    if (terminalQuery) {
      updateEditorStore(state => ({...state, ...editorQuery}));
    }
    if (frameQuery) {
      updateFrameStore(state => ({...state, ...frameQuery}));
    }

    combineLatest([terminalState$, frameState$, editorState$])
      .pipe(debounceTime(1), distinctUntilChanged(shallow), skip(1))
      .subscribe(([terminal, frame, editor]) => {
        console.log(terminal, frame, editor);
        const params = new URLSearchParams(window.location.search);
        setQuery(params, 'terminal', terminal);
        setQuery(params, 'frame', frame);
        setQuery(params, 'editor', editor);
        window.history.replaceState(
          Object.fromEntries(params.entries()),
          '',
          `?${params}`,
        );
      });
  });
}
