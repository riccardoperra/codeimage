import {getFrameState} from '@codeimage/store/editor/frame';
import {provideAppState} from '@codeimage/store/index';
import {withEntityPlugin} from '@codeimage/store/plugins/withEntityPlugin';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {notifications} from '@ui/notifications';
import {untrack} from 'solid-js';
import {withAsyncAction} from 'statebuilder/asyncAction';
import * as api from '../../data-access/signature';
import {useIdb} from '../../hooks/use-indexed-db';
import {getAuth0State} from '../auth/auth0';
import {parseSignature} from '../frame/model';
import type {FrameSignature} from '../frame/model';
import {experimental__defineResource} from '../plugins/bindStateBuilderResource';
import {toSignatureData, withSignatureBridge} from './bridge';
import type {ApiSignature, SavedSignature, SavedSignaturesArray} from './types';

const idbKey = 'signatures';
const idb = useIdb();

/** Keeps the saved signatures whose data still reads as a signature. */
function readable(list: ApiSignature[]): SavedSignaturesArray {
  return list.flatMap(item => {
    const data = parseSignature(item.data);
    return data ? [{...item, data: toSignatureData(data)}] : [];
  });
}

async function fetchInitialState(): Promise<SavedSignaturesArray> {
  const useInMemoryStore = !getAuth0State().loggedIn();
  const request = useInMemoryStore
    ? idb.get<ApiSignature[]>(idbKey).then(data => data ?? [])
    : api.getAllSignatures({});
  return request.then(readable).catch(() => []);
}

const SignatureStoreDefinition = experimental__defineResource(
  fetchInitialState,
  {initialValue: []},
)
  .extend(withEntityPlugin<SavedSignaturesArray>())
  .extend(withIndexedDbPlugin<SavedSignaturesArray>(idbKey, []))
  .extend(withSignatureBridge(idbKey))
  .extend(withAsyncAction())
  .extend(store => {
    const frame = getFrameState();
    const list = (): SavedSignaturesArray =>
      store.loading || store.error ? [] : (store() ?? []);

    /** Puts a saved signature on the frame, as a copy linked to it. */
    const applyToFrame = (signature: SavedSignature) =>
      frame.setSignature({
        ...signature.data,
        savedId: signature.id,
      });

    // Every action changes the list at once and puts it back if the save fails.
    const run = <T>(
      write: () => Promise<T>,
      failure: string,
    ): Promise<T | undefined> =>
      untrack(() => {
        const previous = store();
        return write().catch(() => {
          store.set(previous);
          notifications.show({
            tone: 'danger',
            description: failure,
            theme: 'page',
          });
          return undefined;
        });
      });

    return {
      list,
      limit: () => store.bridge.reachSignatureLimit(),
      defaultSignature: () => list().find(item => item.isDefault) ?? null,
      byId: (id: string | null | undefined) =>
        id ? (list().find(item => item.id === id) ?? null) : null,
      applyToFrame,

      actions: {
        /** Saves the frame's signature as a new one and links the frame to it. */
        saveAsNew: store.asyncAction((payload: {name: string}) =>
          run(async () => {
            const current = frame.store.signature;
            if (!current || store.bridge.reachSignatureLimit()) return;
            const saved = await store.bridge.addSignature(
              payload.name,
              toSignatureData(current),
              false,
            );
            store.set(items => [...(items ?? []), saved]);
            frame.setSignature({...current, savedId: saved.id});
            return saved;
          }, 'The signature was not saved'),
        ),
        /** Writes the frame's signature over a saved one. Snippets keep their own copies. */
        updateWithCurrent: store.asyncAction((payload: SavedSignature) =>
          run(async () => {
            const current = frame.store.signature;
            if (!current) return;
            const saved = await store.bridge.updateSignature(payload, {
              data: toSignatureData(current),
            });
            store.entity.updateBy(
              item => item.id === payload.id,
              () => saved,
            );
            return saved;
          }, 'The signature was not updated'),
        ),
        rename: store.asyncAction(
          (payload: {signature: SavedSignature; name: string}) =>
            run(async () => {
              const saved = await store.bridge.updateSignature(
                payload.signature,
                {name: payload.name},
              );
              store.entity.updateBy(
                item => item.id === payload.signature.id,
                () => saved,
              );
              return saved;
            }, 'The signature was not renamed'),
        ),
        /** Makes it the default for new snippets, or stops it being one. */
        toggleDefault: store.asyncAction((payload: SavedSignature) =>
          run(async () => {
            const isDefault = !payload.isDefault;
            store.set(items =>
              store.bridge.withDefault(
                items ?? [],
                isDefault ? payload.id : null,
              ),
            );
            await store.bridge.updateSignature(payload, {isDefault});
            return payload;
          }, 'The default signature was not changed'),
        ),
        remove: store.asyncAction((payload: SavedSignature) =>
          run(async () => {
            store.entity.removeBy(item => item.id === payload.id);
            await store.bridge.deleteSignature(payload);
            // The frame keeps its copy, without the link to a deleted signature.
            const current = frame.store.signature;
            if (current?.savedId === payload.id)
              frame.setSignature({...current, savedId: null});
            return payload;
          }, 'The signature was not deleted'),
        ),
      },
    };
  });

export function getSignaturesStore() {
  return provideAppState(SignatureStoreDefinition);
}

/**
 * The default saved signature, for a snippet created now. Reads the list
 * itself, so it works before the store has loaded.
 */
export async function loadDefaultSignature(): Promise<FrameSignature | null> {
  const list = await fetchInitialState();
  const saved = list.find(item => item.isDefault);
  const data = saved ? parseSignature(saved.data) : null;
  return data && saved ? {...data, savedId: saved.id} : null;
}
