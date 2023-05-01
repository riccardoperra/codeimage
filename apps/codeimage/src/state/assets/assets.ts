import {provideAppState} from '@codeimage/store/index';
import {generateUid} from '@codeimage/store/plugins/unique-id';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {createEventBus} from '@solid-primitives/event-bus';
import {Accessor, createEffect, createResource, on} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore} from 'statebuilder';

export interface PersistedAsset {
  id: AssetId;
  name: string;
  type: string;
  data: ArrayBuffer;
  origin: 'file' | 'link';
  url: string;
  scope?: string;
}

const assetPrefix = `asset:`;
export type AssetId = `${typeof assetPrefix}${string}`;

export function isAssetUrl(value: string | null | undefined): value is AssetId {
  return !!value && value.startsWith(assetPrefix);
}

export const AssetsStore = defineStore<PersistedAsset[]>(() => [])
  .extend(withIndexedDbPlugin<PersistedAsset[]>('assets', []))
  .extend(store => {
    const bus = createEventBus<boolean>();
    const cache = new WeakMap<PersistedAsset, string>();
    const generateAssetId = (): AssetId => `${assetPrefix}${generateUid()}`;

    const resolve = (data: ArrayBuffer, type: string) => {
      const arrayBufferView = new Uint8Array(data);
      const blob = new Blob([arrayBufferView], {type: type});
      const urlCreator = window.URL || window.webkitURL;
      return urlCreator.createObjectURL(blob);
    };

    store.idb.get().then(data => {
      const dataWithUpdatedUrls = data.map(value => {
        switch (value.origin) {
          case 'file':
            return Object.assign(value, {url: resolve(value.data, value.type)});
          default:
            return value;
        }
      });
      store.set(() => dataWithUpdatedUrls);
    });

    const hydrated = new Promise<boolean>(resolve => {
      bus.listen(() => {
        resolve(true);
        bus.clear();
      });
    });

    createEffect(
      on(store, assetsMap => {
        const unwrappedValue = unwrap(assetsMap);
        store.idb
          .set(unwrappedValue)
          .then(() => bus.emit(true))
          .catch(e => {
            console.error(`Error while synchronizing db 'assets' key: ${e}`);
          });
      }),
    );

    return {
      isAssetUrl,
      isPresent(value: string): Accessor<boolean> {
        return () => !!this.getAsset(value)();
      },
      isAsset(value: unknown): value is PersistedAsset {
        return (
          !!value &&
          typeof value === 'object' &&
          'id' in value &&
          'url' in value
        );
      },
      filterByScope(scope: string): Accessor<PersistedAsset[]> {
        return () =>
          Object.values(store.get).filter(asset => asset.scope === scope);
      },
      getAsset(id: string): Accessor<PersistedAsset | undefined> {
        return () => store.get.find(item => item.id === id);
      },
      getAssetImageBrowserUrl(id: string): Accessor<string | undefined> {
        return () => {
          const asset = this.getAsset(id)();
          if (!asset) return undefined;
          return `url(${asset.url})`;
        };
      },
      async addLink(link: string, scope = 'app') {
        const id = generateAssetId();
        const asset: PersistedAsset = {
          id,
          data: new ArrayBuffer(0),
          type: 'link',
          name: link,
          origin: 'link',
          url: link,
          scope,
        };

        store.set(data => data.concat(asset));

        return asset;
      },
      async addFile(file: File, scope = 'app') {
        const id = generateAssetId();
        const buffer = await file.arrayBuffer();

        const asset: PersistedAsset = {
          id,
          data: buffer,
          type: file.type,
          name: file.name,
          origin: 'file',
          url: resolve(buffer, file.type),
          scope,
        };

        store.set(data => data.concat(asset));

        return asset;
      },
      resolve,
      remove(id: string) {
        store.set(data => data.filter(item => item.id !== id));
      },
      loadAsync(id: Accessor<string>) {
        return createResource(id, async id => {
          await hydrated.then();
          const asset = this.getAsset(id)();
          if (!asset) return Promise.reject(`Image with id ${id} not present`);
          const cached = cache.get(asset);
          if (cached) {
            return cached;
          }
          if (asset.origin === 'link') {
            return new Promise<string>((resolve, reject) => {
              const image = new Image();
              image.src = asset.url;
              image.onload = () => resolve(asset.url);
              image.onerror = () => reject(asset.url);
            });
          }
          return new Promise<string>(async (resolve, reject) => {
            return await fetch(asset.url, {
              headers: {'Content-Type': asset.type},
            })
              .then(res => res.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  cache.set(asset, result);
                  resolve(result);
                };
                reader.onerror = () => reject();
                reader.readAsDataURL(blob);
              });
          });
        });
      },
    };
  });

export function getAssetsStore() {
  return provideAppState(AssetsStore);
}
