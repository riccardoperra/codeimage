---
'@codeimage/cli': minor
'@codeimage/render': minor
---

Add `codeimage --animate`, which writes one animated WebP, GIF, or APNG that morphs each input file into the next. `--hold`, `--transition`, `--easing`, and `--fps` set the timing, and a preset with an `animation` section sets it too. Add `renderAnimation` to `@codeimage/render`, which renders the `animation` a project stores, or every tab in order when it stores none.
