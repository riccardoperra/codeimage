import type {CatalogFont} from './fontManifest';

export interface FontCacheOptions {
  cacheDir?: string;
  offline?: boolean;
  signal?: AbortSignal;
  onEvent?: (event: FontEvent) => void;
}
export type FontEvent =
  | {
      type: 'download' | 'downloaded';
      fontId: string;
      label: string;
      file: string;
      bytes: number;
    }
  | {type: 'repaired'; fontId: string; file: string}
  | {type: 'cache-unwritable'; dir: string; message: string};
export interface FontStatus {
  id: string;
  label: string;
  role: CatalogFont['role'];
  source: string;
  state: 'bundled' | 'cached' | 'partial' | 'missing';
  files: number;
  filesLocal: number;
  bytes: number;
  bytesLocal: number;
}
export class FontUnavailableError extends Error {
  constructor(
    readonly fontId: string,
    readonly reason: 'offline' | 'network' | 'integrity',
    detail: string,
    options?: ErrorOptions,
  ) {
    super(`${fontId}: ${detail}`, options);
  }
}
export class FontFileError extends Error {}
export interface FontCache {
  readonly dir: string;
  list(): Promise<FontStatus[]>;
  install(ids: readonly string[] | 'all'): Promise<FontStatus[]>;
  clean(): Promise<void>;
}
