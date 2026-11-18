import {createEffect, createMemo, onSettled} from 'solid-js';
import type {
  CaptureKind,
  LegacyConnection,
  LegacyMount,
  PropsSnapshot,
} from './contracts.js';

export function readIslandValue(value: unknown, kind: CaptureKind): unknown {
  const type = typeof value;
  const absent = value === null || value === undefined;
  if (kind === 'callback' && (type === 'function' || absent)) return value;
  if (kind !== 'callback' && (type === 'string' || type === 'number' || absent))
    return value;
  if (kind === 'value' && type === 'boolean') return value;
  throw new Error(`Solid 1 bridge cannot forward ${type} as ${kind}`);
}

function propKind(key: string): CaptureKind {
  if (key === 'children') return 'text';
  if (/^on[A-Z]/.test(key)) return 'callback';
  return 'value';
}

function readFlatProps(props: PropsSnapshot): PropsSnapshot {
  return Object.fromEntries(
    Object.keys(props).map(key => {
      if (key === 'ref' || key === 'as') {
        throw new Error(
          `Solid 1 bridge requires an explicit mapping for ${key}`,
        );
      }
      return [key, readIslandValue(props[key], propKind(key))];
    }),
  );
}

export function createSolid1Bridge(
  mount: LegacyMount,
  readProps: (props: PropsSnapshot) => PropsSnapshot = readFlatProps,
) {
  return function Solid1Bridge(props: PropsSnapshot) {
    const snapshot = createMemo(() => readProps(props));
    const target = document.createElement('div');
    let island: LegacyConnection | undefined;

    onSettled(() => {
      island = mount(target, snapshot());
      return island.dispose;
    });

    createEffect(snapshot, nextProps => {
      island?.update(nextProps);
    });

    return target;
  };
}
