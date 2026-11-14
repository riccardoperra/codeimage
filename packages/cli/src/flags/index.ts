import type {ArgDef} from 'citty';
import type {SnapshotDocument} from '@codeimage/render';
import type {CodeInput} from '../snapshot';
import {marks} from './marks';
import {redact} from './redact';
import {size} from './size';
import {split} from './split';
import {alt} from './alt';

export type FlagValues = Record<
  string,
  string | string[] | boolean | undefined
>;
export interface ImageOutput {
  path: string;
  snapshot: SnapshotDocument;
}

export interface Flag {
  args: Record<string, ArgDef & {multiple?: boolean}>;
  apply?(snapshot: SnapshotDocument, values: FlagValues): SnapshotDocument;
  validate?(values: FlagValues): void;
  prepareInputs?(inputs: CodeInput[], values: FlagValues): Promise<CodeInput[]>;
  outputs?(output: ImageOutput, values: FlagValues): ImageOutput[];
  sidecars?(
    output: ImageOutput,
    values: FlagValues,
  ): {path: string; text: string}[];
}

export const FLAGS: readonly Flag[] = [redact, marks, size, split, alt];
