import type {BooleanArgDef, StringArgDef} from 'citty';
import type {SnapshotDocument} from '@codeimage/render';
import type {CodeInput} from '../snapshot';
import {marks} from './marks';
import {redact} from './redact';
import {size} from './size';
import {split} from './split';
import {alt} from './alt';
import {fonts} from './fonts';
import {animate} from './animate';

export type FlagValues = Record<
  string,
  string | string[] | boolean | undefined
>;
export interface ImageOutput {
  path: string;
  snapshot: SnapshotDocument;
}

// A citty option, plus Node's `multiple` for repeatable options.
export type FlagArg = (StringArgDef | BooleanArgDef) & {
  alias?: string;
  multiple?: boolean;
};

export interface Flag {
  args: Record<string, FlagArg>;
  apply?(snapshot: SnapshotDocument, values: FlagValues): SnapshotDocument;
  validate?(values: FlagValues): void;
  prepareInputs?(inputs: CodeInput[], values: FlagValues): Promise<CodeInput[]>;
  outputs?(output: ImageOutput, values: FlagValues): ImageOutput[];
  sidecars?(
    output: ImageOutput,
    values: FlagValues,
  ): {path: string; text: string}[];
}

export const FLAGS: readonly Flag[] = [
  redact,
  marks,
  size,
  split,
  alt,
  fonts,
  animate,
];
