import {provideAppState} from '@codeimage/store/index';
import {generateUid} from '@codeimage/store/plugins/unique-id';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {createEventBus} from '@solid-primitives/event-bus';
import {Accessor, createEffect, createResource, on} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore} from 'statebuilder';

export interface BaseAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  scope?: string;
}

export type PersistedAsset = PersistedFileAsset | PersistedLink;

export interface PersistedFileAsset extends BaseAsset {
  id: AssetId;
  data: ArrayBuffer;
  fileType: string;
  type: 'file';
}

export interface PersistedLink extends BaseAsset {
  id: AssetLinkId;
  type: 'link';
}

const assetPrefix = `asset:`;
const assetLinkPrefix = `link:`;
export type AssetId = `${typeof assetPrefix}${string}`;
export type AssetLinkId = `${typeof assetLinkPrefix}${string}`;

export function isAssetUrl(
  value: string | null | undefined,
): value is AssetId | AssetLinkId {
  return (
    !!value &&
    (value.startsWith(assetPrefix) || value?.startsWith(assetLinkPrefix))
  );
}

export function isAssetLinkUrl(
  value: string | null | undefined,
): value is AssetLinkId {
  return !!value && value.startsWith(assetLinkPrefix);
}

export const AssetsStore = defineStore<PersistedAsset[]>(() => [])
  .extend(withIndexedDbPlugin<PersistedAsset[]>('assets', []))
  .extend(store => {
    const bus = createEventBus<boolean>();
    const cache = new WeakMap<PersistedAsset, string>();
    const generateAssetId = (): AssetId => `${assetPrefix}${generateUid()}`;
    const generateAssetLinkId = (link: string): AssetLinkId =>
      `${assetLinkPrefix}${link}`;

    const resolve = (data: ArrayBuffer, type: string) => {
      const arrayBufferView = new Uint8Array(data);
      const blob = new Blob([arrayBufferView], {type: type});
      const urlCreator = window.URL || window.webkitURL;
      return urlCreator.createObjectURL(blob);
    };

    const hydrated = new Promise<boolean>(resolve => {
      bus.listen(() => {
        resolve(true);
        bus.clear();
      });
    });

    store.idb.get().then(data => {
      const dataWithUpdatedUrls = data.map(value => {
        switch (value.type) {
          case 'file':
            return Object.assign(value, {url: resolve(value.data, value.type)});
          default:
            return value;
        }
      });
      store.set(() => dataWithUpdatedUrls);
      bus.emit(true);
    });

    createEffect(
      on(store, assetsMap => {
        const unwrappedValue = unwrap(assetsMap);
        store.idb.set(unwrappedValue).catch(e => {
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
      filterByScope(scopes: string[]): Accessor<PersistedAsset[]> {
        return () =>
          Object.values(store.get).filter(asset =>
            scopes.includes(asset.scope ?? ''),
          );
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
        const id = generateAssetLinkId(link.trim());
        const asset: PersistedAsset = {
          id,
          type: 'link',
          name: link,
          url: link,
          scope,
        };

        store.set(data => data.concat(asset));

        return asset;
      },
      async addFile(file: File, scope = 'app') {
        const id = generateAssetId();
        const buffer = await file.arrayBuffer();

        const asset: PersistedFileAsset = {
          id,
          type: 'file',
          data: buffer,
          fileType: file.type,
          name: file.name,
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
          if (isAssetLinkUrl(id)) {
            const [, url] = id.split(assetLinkPrefix);
            const asset =
              this.getAsset(id)() ?? (await this.addLink(url, 'app'));
            return new Promise<string>((resolve, reject) => {
              const image = new Image();
              image.src = asset.url;
              image.onload = () => resolve(asset.url);
              image.onerror = () => reject(asset.url);
            });
          }

          const asset = this.getAsset(id)();
          if (!asset) return Promise.reject(`Image with id ${id} not present`);
          const cached = cache.get(asset);
          if (cached) {
            return cached;
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
