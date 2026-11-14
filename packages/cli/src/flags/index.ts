import type {ParseArgsOptionsConfig} from 'node:util';
import type {SnapshotInput} from '@codeimage/render';
import type {CodeInput} from '../snapshot';
import {marks} from './marks';
import {redact} from './redact';
import {size} from './size';
import {split} from './split';
import {alt} from './alt';

export type FlagValues = Record<string, string | boolean | undefined>;
export interface ImageOutput {
  path: string;
  snapshot: SnapshotInput;
}

export interface Flag {
  options: ParseArgsOptionsConfig;
  usage: string;
  apply(snapshot: SnapshotInput, values: FlagValues): SnapshotInput;
  validate?(values: FlagValues): void;
  prepareInputs?(inputs: CodeInput[], values: FlagValues): Promise<CodeInput[]>;
  outputs?(output: ImageOutput, values: FlagValues): ImageOutput[];
  sidecars?(
    output: ImageOutput,
    values: FlagValues,
  ): {path: string; text: string}[];
}

export const FLAGS: readonly Flag[] = [redact, marks, size, split, alt];
