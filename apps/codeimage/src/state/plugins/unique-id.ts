import {createUniqueId as $createUniqueId} from 'solid-js';

export function createUniqueId(v = 0): string {
  const id = $createUniqueId();
  return `${id}$${v ?? 0}`;
}

export function versionateId(id: string): string {
  const [uid, version = null] = id.split('$');
  if (!uid || version === null) {
    console.warn(`[DEV] Unable to versionate ${id} id`);
    return id;
  }
  return `${uid}$${parseInt(version, 10) + 1}`;
}

export const generateUid = (a = '') => {
  return a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateUid);
};

export function createRandomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createEditorId(): string {
  return `${createRandomId()}$0`;
}
