import {
  checkLocalFontPermission,
  isLocalFontsFeatureSupported,
} from '@core/modules/localFontAccessApi/api';
import type * as Solid from 'solid-js';
import {createRoot, flush} from 'solid-js';
import {Container, defineStore} from 'statebuilder';
import {expect, test, vi} from 'vitest';
import {useLocalFonts, type LoadedFont} from '../../../hooks/use-local-fonts';
import type {ConfigState} from '../config.store';
import {withLocalFontManagementPlugin} from './localFont';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);
vi.mock('@core/modules/localFontAccessApi/api');
vi.mock('../../../hooks/use-local-fonts');

const config = defineStore((): ConfigState => ({
  ready: true,
  fonts: [],
  systemFonts: [],
  devMode: false,
  renderer: 'dom-export',
})).extend(withLocalFontManagementPlugin());

class FontPermission extends EventTarget {
  readonly name = 'geolocation';
  state: PermissionState = 'denied';
  onchange = null;
}

test('font access follows permission changes and discards a response after closing', async () => {
  const permission = new FontPermission();
  const load = Promise.withResolvers<LoadedFont[]>();
  vi.mocked(isLocalFontsFeatureSupported).mockReturnValue(true);
  vi.mocked(checkLocalFontPermission).mockResolvedValue(permission);
  vi.mocked(useLocalFonts).mockReturnValue(load.promise);
  const {api, dispose} = createRoot(dispose => ({
    api: Container.create().get(config).localFontsApi,
    dispose,
  }));
  const close = api.observeSystemFonts();
  try {
    await Promise.resolve();
    flush();
    expect(api.state().permissionState).toBe('denied');
    expect(useLocalFonts).not.toHaveBeenCalled();

    permission.state = 'granted';
    permission.dispatchEvent(new Event('change'));
    flush();
    expect(api.state().permissionState).toBe('granted');
    expect(api.state().loading).toBe(true);

    close?.();
    load.resolve([
      {family: 'Late font', faces: [], sources: [], monospaced: false},
    ]);
    await load.promise;
    flush();
    expect(api.state().fonts).toEqual([]);
  } finally {
    close?.();
    dispose();
  }
});
