---
'@codeimage/atomic-state': major
'@codeimage/app': patch
---

Use Solid signals and callbacks for editor persistence, clipboard export, and local font access. Remove RxJS from the app and atomic-state package.

The third value returned by atomic-state's `createStore` exposes a `snapshot()` accessor. Use a Solid effect to observe committed snapshots. The observable adapters and the experimental RxJS effect API have been removed.
