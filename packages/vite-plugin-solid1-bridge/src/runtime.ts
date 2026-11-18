import {createEffect, createMemo, onCleanup, onSettled} from 'solid-js';
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

export function readWidgetProps(props: PropsSnapshot): PropsSnapshot {
  const seen = new WeakMap<object, object>();
  return Object.fromEntries(
    Object.keys(props).map(key => {
      const value = props[key];
      if (key === 'ref') return [key, readIslandValue(value, 'callback')];
      if (key === 'style' && value && typeof value === 'object')
        return [key, Object.fromEntries(Object.entries(value))];
      if (
        [
          'children',
          'leftIcon',
          'rightIcon',
          'icon',
          'content',
          'label',
        ].includes(key)
      )
        return [key, readSlot(value)];
      if (['options', 'value', 'defaultValue', 'slotClasses'].includes(key))
        return [key, readData(value, seen)];
      if (
        [
          'optionValue',
          'optionTextValue',
          'optionDisabled',
          'itemLabel',
          'valueComponent',
        ].includes(key) &&
        typeof value === 'function'
      )
        return [key, value];
      return [key, readIslandValue(value, propKind(key))];
    }),
  );
}

function readData(value: unknown, seen: WeakMap<object, object>): unknown {
  if (!value || typeof value !== 'object')
    return readIslandValue(value, 'value');
  const cached = seen.get(value);
  if (cached) return cached;
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    seen.set(value, result);
    for (const item of value) result.push(readData(item, seen));
    return result;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error('Solid 1 bridge expects plain widget data');
  const result: Record<string, unknown> = {};
  seen.set(value, result);
  for (const [key, item] of Object.entries(value))
    Object.defineProperty(result, key, {
      value: readData(item, seen),
      enumerable: true,
    });
  return result;
}

function readSlot(value: unknown): unknown {
  if (typeof value === 'function' && value.length === 0)
    return readSlot(value());
  if (value instanceof Node) return value;
  if (Array.isArray(value)) return value.map(readSlot);
  return readIslandValue(value, 'value');
}

export function createSolid1Bridge(
  mount: LegacyMount,
  readProps: (props: PropsSnapshot) => PropsSnapshot = readFlatProps,
) {
  return function Solid1Bridge(props: PropsSnapshot) {
    const snapshot = createMemo(() => readProps(props));
    const target = document.createElement('div');
    if (readProps === readWidgetProps) target.style.display = 'contents';
    let island: LegacyConnection | undefined;
    let disposed = false;

    onSettled(() => {
      if (!disposed) island = mount(target, snapshot());
    });

    onCleanup(() => {
      disposed = true;
      island?.dispose();
    });

    createEffect(snapshot, nextProps => {
      island?.update(nextProps);
    });

    return target;
  };
}
