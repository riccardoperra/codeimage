import type {LocalAiProviderId} from '../shell/preferences';
import {preferences} from '../shell/preferences';
import {chromeProvider, NATIVE_PROBE} from './chrome-provider';
import {
  chromeLanguageModel,
  createLanguageModel,
  LANGUAGES,
  log,
} from './language-model';
import type {ModelProvider, ToolSpec} from './model';
import {structuredProvider} from './structured-provider';

export type ProviderName = Exclude<LocalAiProviderId, 'auto'>;

/**
 * The provider the choice names. Auto takes native tool calling when Chrome
 * runs it here, and structured output otherwise.
 */
export async function pickProvider(
  choice: LocalAiProviderId,
  nativeAvailable: () => Promise<boolean>,
): Promise<ProviderName> {
  if (choice !== 'auto') return choice;
  return (await nativeAvailable()) ? 'native' : 'structured';
}

/** A provider that asks the choice, on each call, which provider to use. */
export function selectProvider(
  choice: () => LocalAiProviderId,
  providers: Readonly<Record<ProviderName, ModelProvider>>,
): ModelProvider {
  const pick = (tools: readonly ToolSpec[]) =>
    pickProvider(
      choice(),
      async () => (await providers.native.availability(tools)) === 'available',
    );
  return {
    async availability(tools) {
      return providers[await pick(tools)].availability(tools);
    },
    async open(input) {
      const name = await pick(input.tools);
      log('provider', name);
      return providers[name].open(input);
    },
  };
}

/** The provider the bar uses, as Settings chooses it. */
export const localAiProvider = selectProvider(preferences.localAiProvider, {
  native: chromeProvider,
  structured: structuredProvider,
});

/** Chrome's on-device model for the chosen provider, shared by Settings and the bar. */
export const languageModel = createLanguageModel(
  chromeLanguageModel,
  async () =>
    (await pickProvider(
      preferences.localAiProvider(),
      async () =>
        (await chromeLanguageModel
          ?.availability(NATIVE_PROBE)
          .catch(() => 'unavailable')) === 'available',
    )) === 'native'
      ? NATIVE_PROBE
      : LANGUAGES,
);
