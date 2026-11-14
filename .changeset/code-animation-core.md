---
'@codeimage/app': patch
---

Compiles two code steps into one keyframed scene, so a later export can morph one tab into the next. Tokens that both steps keep slide to their new place, removed tokens fade out, and new tokens fade in.

Plain Text tabs keep their blank lines in the static export. Before, a blank line in a tab without a language parser had no height, so the lines after it moved up.
