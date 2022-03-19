import {parse} from 'query-string';
import {createStore} from 'solid-js/store';
import {serialize} from 'v8';

export function useQueryParams() {
  const initialState = parse(window.location.search, {
    parseBooleans: true,
    parseNumbers: true,
    decode: true,
    parseFragmentIdentifier: true,
  });

  const [params, setInternalParams] = createStore(initialState);

  function replaceQuery(state: Record<string, object>): void {
    const params = new URLSearchParams(window.location.search);

    const query = serialize(
      Object.fromEntries(
        Object.entries(state).filter(
          ([, v]) => v !== null && v !== undefined && typeof v !== 'function',
        ),
      ),
    );

    const parsedQuery = parse(query);
    setInternalParams(parsedQuery);

    window.history.replaceState(
      Object.fromEntries(params.entries()),
      '',
      `?${query}`,
    );
  }

  return [params, replaceQuery] as const;
}
