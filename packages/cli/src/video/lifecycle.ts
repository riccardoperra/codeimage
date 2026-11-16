import {rmSync} from 'node:fs';
import type {ChildProcess} from 'node:child_process';

const partials = new Set<string>();
const children = new Set<ChildProcess>();

export function trackPartial(path: string) {
  partials.add(path);
  return () => partials.delete(path);
}

export function trackEncoder(child: ChildProcess) {
  children.add(child);
  return () => children.delete(child);
}

// Synchronous cleanup also runs while a native frame is in flight.
export function stopVideo() {
  for (const child of children) child.kill('SIGKILL');
  for (const path of partials) {
    try {
      rmSync(path, {force: true});
    } catch {
      // Continue cleanup if a concurrent rename already removed the file.
    }
  }
}
