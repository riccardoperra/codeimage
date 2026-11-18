# @codeimage/cli

## 0.2.0

### Minor Changes

- [#702](https://github.com/riccardoperra/codeimage/pull/702) [`b365164`](https://github.com/riccardoperra/codeimage/commit/b365164f2c340a1c80b6b71bbc9d196c80ddc54a) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add CLI flags for every new export feature: `--diff`, repeatable `--highlight` and `--focus` line ranges, and Shiki `[!code ...]` annotations for line marks; secret redaction on by default with `--no-redact`; `--size` and `--signature` for social formats; `--split-tabs` for one image per file; and `--alt` to write alt text next to the image.

- [#702](https://github.com/riccardoperra/codeimage/pull/702) [`82f9d8e`](https://github.com/riccardoperra/codeimage/commit/82f9d8ecac523c8f5de44b0d5000e9cefd225e9f) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add the codeimage command to export source files or stdin with web presets, language inference, line ranges, themes, and image formats. Add `inferLanguageFromPath` to `@codeimage/config`.

- [#741](https://github.com/riccardoperra/codeimage/pull/741) [`4ca1db5`](https://github.com/riccardoperra/codeimage/commit/4ca1db5491963c4b63bd8674e562f44dc71551ef) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Render the new editor's Card, Editor and Terminal windows, the wash surface, the hairline border and the Minimal, Pill and Card signatures in the CLI from the same frame component as the web export. Presets copied from the new UI keep their window and signature fields, and an avatar that cannot load draws initials.

  Embed variable-weight font faces in browser exports, and lay out SVG exports at the display's pixel ratio in every Blink browser, headless Chromium included.

- [#726](https://github.com/riccardoperra/codeimage/pull/726) [`ca114da`](https://github.com/riccardoperra/codeimage/commit/ca114dafddc614c54185e45c68bbec09ffd6121e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add `codeimage --animate`, which writes one animated WebP, GIF, or APNG that morphs each input file into the next. `--hold`, `--transition`, `--easing`, and `--fps` set the timing, and a preset with an `animation` section sets it too. Add `renderAnimation` to `@codeimage/render`, which renders the `animation` a project stores, or every tab in order when it stores none.

- [#785](https://github.com/riccardoperra/codeimage/pull/785) [`b7b9477`](https://github.com/riccardoperra/codeimage/commit/b7b9477c1779c3fc7f67518ac3279fbd550da49d) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Export code animations as H.264 MP4 from the CLI using user-installed ffmpeg
  with libx264. Resolve ffmpeg from a flag, environment, PATH, or Windows WinGet
  Links. Offer confirmed package-manager setup in interactive macOS and Windows
  sessions. Expose raw animation frames from the renderer.

### Patch Changes

- Updated dependencies [[`4ca1db5`](https://github.com/riccardoperra/codeimage/commit/4ca1db5491963c4b63bd8674e562f44dc71551ef), [`ca114da`](https://github.com/riccardoperra/codeimage/commit/ca114dafddc614c54185e45c68bbec09ffd6121e), [`b7b9477`](https://github.com/riccardoperra/codeimage/commit/b7b9477c1779c3fc7f67518ac3279fbd550da49d), [`0eafcd5`](https://github.com/riccardoperra/codeimage/commit/0eafcd573594fdaabe86b8037b9ee5b971916082)]:
  - @codeimage/render@0.2.0
