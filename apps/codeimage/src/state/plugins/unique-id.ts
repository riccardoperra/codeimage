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
