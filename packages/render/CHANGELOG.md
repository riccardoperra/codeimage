# @codeimage/render

## 0.2.0

### Minor Changes

- [#741](https://github.com/riccardoperra/codeimage/pull/741) [`4ca1db5`](https://github.com/riccardoperra/codeimage/commit/4ca1db5491963c4b63bd8674e562f44dc71551ef) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Render the new editor's Card, Editor and Terminal windows, the wash surface, the hairline border and the Minimal, Pill and Card signatures in the CLI from the same frame component as the web export. Presets copied from the new UI keep their window and signature fields, and an avatar that cannot load draws initials.

  Embed variable-weight font faces in browser exports, and lay out SVG exports at the display's pixel ratio in every Blink browser, headless Chromium included.

- [#726](https://github.com/riccardoperra/codeimage/pull/726) [`ca114da`](https://github.com/riccardoperra/codeimage/commit/ca114dafddc614c54185e45c68bbec09ffd6121e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add `codeimage --animate`, which writes one animated WebP, GIF, or APNG that morphs each input file into the next. `--hold`, `--transition`, `--easing`, and `--fps` set the timing, and a preset with an `animation` section sets it too. Add `renderAnimation` to `@codeimage/render`, which renders the `animation` a project stores, or every tab in order when it stores none.

- [#702](https://github.com/riccardoperra/codeimage/pull/702) [`0eafcd5`](https://github.com/riccardoperra/codeimage/commit/0eafcd573594fdaabe86b8037b9ee5b971916082) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Render saved projects to PNG, JPEG, WebP, or SVG in Node with Takumi, without a browser. The renderer server-renders the export frame from the app's components and P1's static code view.

  Load remote SVG icons through a resource that also resolves during server rendering.

### Patch Changes

- [#785](https://github.com/riccardoperra/codeimage/pull/785) [`b7b9477`](https://github.com/riccardoperra/codeimage/commit/b7b9477c1779c3fc7f67518ac3279fbd550da49d) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Export code animations as H.264 MP4 from the CLI using user-installed ffmpeg
  with libx264. Resolve ffmpeg from a flag, environment, PATH, or Windows WinGet
  Links. Offer confirmed package-manager setup in interactive macOS and Windows
  sessions. Expose raw animation frames from the renderer.
