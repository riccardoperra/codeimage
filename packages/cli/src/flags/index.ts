import type {ParseArgsOptionsConfig} from 'node:util';
import type {SnapshotInput} from '@codeimage/render';

export type FlagValues = Record<string, string | boolean | undefined>;

export interface Flag {
  options: ParseArgsOptionsConfig;
  usage: string;
  apply(snapshot: SnapshotInput, values: FlagValues): SnapshotInput;
}

export const FLAGS: readonly Flag[] = [];
