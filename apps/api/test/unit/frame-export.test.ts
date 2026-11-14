import {Value} from '@sinclair/typebox/value';
import {describe, expect, it} from 'vitest';
import {PresetDataSchema} from '../../src/modules/preset/schema/preset-dto.schema';
import {
  FrameSignatureSchema,
  readFrameSignature,
} from '../../src/modules/project/schema/frame-export.schema';
import {SnippetFrameCreateRequestSchema} from '../../src/modules/project/schema/project-create.schema';
import {SnippetFrameUpdateRequestSchema} from '../../src/modules/project/schema/project-update.schema';

const frame = {
  background: '#123456',
  padding: 64,
  radius: 8,
  visible: true,
  opacity: 100,
};

describe('social export persistence', () => {
  it.each(['bottom-left', 'bottom-right'])(
    'accepts a %s signature in projects and presets',
    position => {
      const data = {
        ...frame,
        aspectRatio: null,
        exportTarget: 'x-landscape',
        signature: {handle: '@me', position},
      };
      expect(Value.Check(SnippetFrameCreateRequestSchema, data)).toBe(true);
      expect(Value.Check(SnippetFrameUpdateRequestSchema, data)).toBe(true);
      expect(Value.Check(PresetDataSchema.properties.frame, data)).toBe(true);
    },
  );

  it('accepts old projects and presets without export settings', () => {
    expect(Value.Check(SnippetFrameCreateRequestSchema, frame)).toBe(true);
    expect(Value.Check(SnippetFrameUpdateRequestSchema, frame)).toBe(true);
    expect(Value.Check(PresetDataSchema.properties.frame, frame)).toBe(true);
    expect(readFrameSignature({})).toBeNull();
  });

  it('restores a stored signature and treats missing or invalid corners as absent', () => {
    expect(
      readFrameSignature({
        signatureHandle: '@me',
        signaturePosition: 'bottom-left',
      }),
    ).toEqual({handle: '@me', position: 'bottom-left'});
    expect(
      readFrameSignature({signatureHandle: null, signaturePosition: null}),
    ).toBeNull();
    expect(
      readFrameSignature({
        signatureHandle: '@me',
        signaturePosition: 'top-left',
      }),
    ).toBeNull();
    expect(
      Value.Check(FrameSignatureSchema, {handle: '@me', position: 'top-left'}),
    ).toBe(false);
  });
});
