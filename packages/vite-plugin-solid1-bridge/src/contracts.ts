import type {PluginOption} from 'vite';

export interface LegacyModuleRule {
  standalone?: readonly string[];
  compound?: readonly string[];
}

export interface LegacyBuildOptions {
  root: string;
  plugins: PluginOption[];
}

export interface Solid1BridgeOptions {
  entries: readonly string[];
  modules: Readonly<Record<string, LegacyModuleRule>>;
  legacyComponents?: readonly string[];
  legacy: LegacyBuildOptions;
}

export type PropsSnapshot = Readonly<Record<string, unknown>>;

export interface LegacyConnection<Props = PropsSnapshot> {
  update(next: Props): void;
  dispose(): void;
}

export type LegacyMount<Props = PropsSnapshot> = (
  target: HTMLElement,
  initialProps: Props,
) => LegacyConnection<Props>;

export type CaptureKind = 'callback' | 'text' | 'value';
