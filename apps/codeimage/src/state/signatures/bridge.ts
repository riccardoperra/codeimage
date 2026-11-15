import {getAuth0State} from '@codeimage/store/auth/auth0';
import {generateUid} from '@codeimage/store/plugins/unique-id';
import {createEffect, on} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {makePlugin} from 'statebuilder';
import * as api from '../../data-access/signature';
import {useIdb} from '../../hooks/use-indexed-db';
import type {FrameSignature} from '../frame/model';
import type {
  SavedSignature,
  SavedSignaturesArray,
  SignatureData,
} from './types';

/** Saved signatures per user, for guests and accounts alike. */
export const signatureLimit = Number(import.meta.env.VITE_SIGNATURE_LIMIT ?? 3);

/** The fields a saved signature keeps; the link back stays with the snippet. */
export function toSignatureData(signature: FrameSignature): SignatureData {
  const {savedId: _, ...data} = signature;
  return {...data};
}

export const withSignatureBridge = (idbKey: string) =>
  makePlugin(
    store => {
      const idb = useIdb();
      const useInMemoryStore = () => !getAuth0State().loggedIn();
      function persistToIdb(data: SavedSignaturesArray) {
        return idb.set(idbKey, unwrap(data)).then();
      }

      // A guest's signatures live in IndexedDB; an account's in the API.
      createEffect(
        on(
          store,
          resource => {
            if (useInMemoryStore()) {
              void persistToIdb(resource ?? []);
            }
          },
          {defer: true},
        ),
      );

      // One default per user: making one the default clears the others.
      const withDefault = (
        list: SavedSignaturesArray,
        defaultId: string | null,
      ): SavedSignaturesArray =>
        list.map(item => ({...item, isDefault: item.id === defaultId}));

      const bridge = {
        useInMemoryStore,
        persistToIdb,
        withDefault,
        reachSignatureLimit() {
          return (store()?.length ?? 0) >= signatureLimit;
        },
        addSignature(
          name: string,
          data: SignatureData,
          isDefault: boolean,
        ): Promise<SavedSignature> {
          if (useInMemoryStore()) {
            const now = new Date().toISOString();
            return Promise.resolve({
              id: generateUid(),
              name,
              isDefault,
              createdAt: now,
              updatedAt: now,
              version: 1,
              data,
            });
          }
          return api.createSignature({
            body: {name, data, isDefault},
          }) as Promise<SavedSignature>;
        },
        updateSignature(
          signature: SavedSignature,
          changes: Partial<Pick<SavedSignature, 'name' | 'data' | 'isDefault'>>,
        ): Promise<SavedSignature> {
          if (useInMemoryStore()) {
            return Promise.resolve({
              ...signature,
              ...changes,
              version: signature.version + 1,
              updatedAt: new Date().toISOString(),
            });
          }
          return api.updateSignature({
            params: {id: signature.id},
            body: changes,
          }) as Promise<SavedSignature>;
        },
        deleteSignature(signature: SavedSignature): Promise<SavedSignature> {
          return useInMemoryStore()
            ? Promise.resolve(signature)
            : api
                .deleteSignature({params: {id: signature.id}})
                .then(() => signature);
        },
      };
      return {bridge} as const;
    },
    {name: 'withSignatureBridge'},
  );
