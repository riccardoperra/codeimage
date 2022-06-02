import {frame$, updateFrameStore} from '@codeimage/store/frame';
import {terminal$, updateTerminalStore} from '@codeimage/store/terminal';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  skip,
} from 'rxjs';
import {useSearchParams} from 'solid-app-router';
import {onMount} from 'solid-js';
import shallow from '../../core/helpers/shallow';
import {selectSlice} from '../../core/operators/selectSlice';

/**
 * @deprecated This feature must be refactored.
 */
export function connectStoreWithQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const terminalState$ = terminal$.pipe(
    selectSlice([
      'showHeader',
      'type',
      'tabName',
      'accentVisible',
      'background',
      'textColor',
      'darkMode',
      'showWatermark',
      'showGlassReflection',
    ]),
  );
  const frameState$ = frame$.pipe(
    selectSlice(['background', 'padding', 'radius', 'visible', 'opacity']),
  );

  onMount(() => {
    const data = searchParams.p;

    if (data) {
      try {
        const params = JSON.parse(decodeURIComponent(window.atob(data)));
        if (params) {
          if (params.terminal) {
            updateTerminalStore(state => ({...state, ...params.terminal}));
          }
          if (params.frame) {
            updateFrameStore(state => ({...state, ...params.frame}));
          }
        }
      } catch (e) {
        console.warn('[CodeImage] Error while parsing query params data', e);
      }
    } else {
      combineLatest([terminalState$, frameState$])
        .pipe(
          debounceTime(1000),
          map(([terminal, frame]) => ({
            terminal,
            frame,
          })),
          distinctUntilChanged(shallow),
          skip(1),
        )
        .subscribe(state => {
          const params = {
            p: window.btoa(encodeURIComponent(JSON.stringify(state))),
          };
          setSearchParams(params, {
            scroll: false,
          });
        });
    }
  });
}
