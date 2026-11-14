import {Type, type Static} from '@sinclair/typebox';
import {Nullable} from '../../../common/typebox/nullable.js';

export const FrameSignatureSchema = Type.Object({
  handle: Type.String(),
  position: Type.Union([
    Type.Literal('bottom-left'),
    Type.Literal('bottom-right'),
  ]),
});

export const ExportTargetSchema = Type.Union([
  Type.Literal('x-landscape'),
  Type.Literal('square'),
  Type.Literal('linkedin-portrait'),
  Type.Literal('open-graph'),
]);

export const FrameExportProperties = {
  exportTarget: Type.Optional(Nullable(ExportTargetSchema)),
  aspectRatio: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  signature: Type.Optional(Nullable(FrameSignatureSchema)),
};

export function readFrameSignature(frame: {
  signatureHandle?: string | null;
  signaturePosition?: string | null;
}): Static<typeof FrameSignatureSchema> | null {
  const {signatureHandle: handle, signaturePosition: position} = frame;
  return handle && (position === 'bottom-left' || position === 'bottom-right')
    ? {handle, position}
    : null;
}

export function readFrameExportProperties(frame: {
  exportTarget?: string | null;
  signatureHandle?: string | null;
  signaturePosition?: string | null;
}) {
  return {
    exportTarget:
      ExportTargetSchema.anyOf.find(
        target => target.const === frame.exportTarget,
      )?.const ?? null,
    signature: readFrameSignature(frame),
  };
}

export function mapStoredFrame<
  T extends {
    exportTarget?: string | null;
    signatureHandle?: string | null;
    signaturePosition?: string | null;
  },
>(frame: T) {
  const {signatureHandle, signaturePosition, ...properties} = frame;
  return {...properties, ...readFrameExportProperties(frame)};
}
