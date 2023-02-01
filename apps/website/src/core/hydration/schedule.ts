export function runOnIdle<T>(
  fn: () => T,
  timeout: number,
  tryWithNativeScheduler: boolean,
): Promise<T> {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/scheduler
  if (tryWithNativeScheduler && 'scheduler' in window) {
    // @ts-expect-error Not present in current types
    return scheduler.postTask(() => fn(), {priority: 'background'});
  }
  return new Promise<T>(r => {
    const cb = () => r(fn());
    if ('requestIdleCallback' in window) {
      requestIdleCallback(cb, {timeout: timeout ?? undefined});
    } else {
      setTimeout(cb, timeout);
    }
  });
}
