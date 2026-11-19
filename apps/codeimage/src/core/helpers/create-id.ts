import {getNextChildId, getOwner} from 'solid-js';

let nextId = 0;

export function createId() {
  const owner = getOwner();
  return owner?.id ? getNextChildId(owner) : `codeimage-${++nextId}`;
}
