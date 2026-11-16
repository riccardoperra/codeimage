# A6 CLI MP4 verification

The comparison base is `e6741ee9e33f4ff88942a9d5f6012485a566a8cc` on
`feat/p3-node-renderer`. Merge commit `9528b0f7872379c570ce312568225c8dfeea48c5`
merges that base into A6 with two parents. The merge needed no conflict edits.
The raw-frame API and all new animation exports remain present. The existing
encoded animation function is unchanged by A6.

Verification uses macOS arm64, Node 24.14.0, pnpm 12.18.0, and Takumi 2.19.0.
The baseline is an isolated source archive of e6741ee9 with its own frozen
install and library build under `/tmp/codeimage-a6-realigned/base/`.

## Local checks

Frozen install and `pnpm libs:build` pass on the merged branch and the base.
`pnpm --filter=@codeimage/cli test` passes 160 tests in 12 files, including
13 video tests. CLI typecheck, lint, and oxfmt pass. The fake local release
server tests integrity failure, repeat/concurrent installation, licence
failure, cancellation cleanup, and non-TTY stderr. Raw RGBA frames match
native APNG pixels at fractional frame boundaries.

A6 adds no dependencies or lockfile churn relative to its base. The merge
includes the base's lockfile changes. The legacy commit hook rejects the
requested `cli` scope; commits retain that scope and the requested co-author
trailer with that hook bypassed.

## Live lanes

Lanes 1–9 ran serially through tmux in this checkout. They were not delegated
to ten model/worktree lanes. Results are in
`/tmp/codeimage-a6-realigned/live/results.json`; the transcript is
`/tmp/codeimage-a6-realigned/live.log`. Windows and Linux execution are
unverified.

| Lane | Result                                                | Evidence                                                                                                                                                                                                |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Pass                                                  | WebP is byte-identical to e6741ee9, 1,221,744 bytes.                                                                                                                                                    |
| 2    | Pass                                                  | H.264 High, yuv420p, all BT.709 tags and limited range. 180 frames at 60 fps, keyframes at 0 and 2 s, moov before mdat. Redirected stdout is also a valid MP4.                                          |
| 3    | Pass                                                  | First export downloads once, second reuses cache. Fresh-cache offline export exits 2 and lists all four ffmpeg sources. macOS correctly uses Library/Caches.                                            |
| 4    | Pass                                                  | Wrappers record flag, environment, then PATH in order.                                                                                                                                                  |
| 5    | Pass                                                  | Explicit installation downloads once and prints the same binary path twice.                                                                                                                             |
| 6    | Pass                                                  | Concurrent exports both play; cache has one executable, LICENSE, README, and no partials.                                                                                                               |
| 7    | Pass                                                  | A 545 px raw frame encodes at 546 px with its edge repeated.                                                                                                                                            |
| 8    | Pass                                                  | SIGINT exits in 12 ms, with no encoder, output MP4, or partial file.                                                                                                                                    |
| 9    | Pass                                                  | SIGINT during download exits in 6 ms, leaves no partial, and retry downloads again.                                                                                                                     |
| 10   | Pass for the saved Square target; Current frame fails | The same saved JSON produces matching 1080x1080, 30 fps, 69-frame videos. Worst sampled frame difference is 0.3854%. The initial Current frame comparison has different dimensions, as described below. |

Lane 10 created two tabs, selected the Editor window and the persisted Square
frame target, opened Animate and the MP4 settings, and downloaded the web MP4
through visible controls in isolated Chrome 157.0.8103.78. It then read the
actual guest document from IndexedDB without changing its values and passed
that JSON to `codeimage project.json --animate --scale 1 -o cli.mp4`.
Both files have H.264 High, yuv420p, BT.709 limited range, and 2.3 s duration.
Seven corresponding decoded frames, including transition frames, differ by
0.246% to 0.385% with pixelmatch threshold 0.1. The rule is at most 2%.
These are local browser runs with MSW and development authentication. They do
not verify the real API or OAuth. The shared T3 preview was tried first, but
two snapshots failed because the browser produced no screenshot frames.
Playwright used a fresh owned Chrome profile and removed it afterward.

The initial default Current frame comparison failed before pixel comparison:
web output is 592x284, CLI output is 546x290. The web measurement uses the live
editor canvas width; that width is absent from the persisted JSON. Native
rendering sizes each step from its content. The Square fixture makes the
output size part of the saved project. This does not fix or hide the Current
frame mismatch. Small inherited header-colour and watermark-placement
visual differences also remain visible in the captured frames, within the
stated pixel tolerance. No pixel-identical web/CLI claim is made.

Lane 10 artifacts are in `/tmp/codeimage-a6-realigned/lane10-square/`, including
`project.json`, both MP4s, seven frame pairs, diffs, metadata, screenshots,
`result.json`, and `trace.zip`. The failed default case is retained in
`/tmp/codeimage-a6-realigned/lane10-retry/`. The reproducible helper is
`packages/cli/scripts/verify-web-mp4.mjs`. Against a locally running web app:

```sh
A6_TARGET=square node packages/cli/scripts/verify-web-mp4.mjs http://127.0.0.1:4459 /tmp/a6-parity
```

Omit A6_TARGET to reproduce the Current frame mismatch. Terminal capture PNGs
in `/tmp/codeimage-verification/` are rendered transcripts, not native window
screenshots. `a6-review.mp4` is the prior 40-second live tmux recording with
actual MP4 playback composited below; it predates the base merge. The new
web export screenshot is `a6-review-web-vs-cli.png` in that directory.

## Performance

The e6741ee9 probe passes both numeric gates. Ten interleaved WebP pairs are
byte-identical, and all ten cached MP4 exports have 180 frames at 1920x1080.
Every timed process starts with load below 8, ranging from 7.219 to 7.941.
The machine also runs other programs, so these remain shared-host timings.

| Metric            |     Base |       A6 | Rule                 | Result       |
| ----------------- | -------: | -------: | -------------------- | ------------ |
| WebP median       | 0.8839 s | 0.8927 s | A6/base at most 1.05 | Pass, 1.0099 |
| Cached MP4 median |      n/a | 2.2377 s | At most 6 s          | Pass         |

MP4 runs range from 1.8635 to 4.2556 s. Raw measurements,
load at every start, and byte counts are in
`/tmp/codeimage-a6-realigned/perf/results.json`; the transcript is
`/tmp/codeimage-a6-realigned/perf.log`. The V8/native profile from the prior
run showed waiting for native rendering and the pipe. No source-level
speedup is claimed from this comparison.

The replay command is:

```sh
node packages/cli/scripts/benchmark-mp4.mjs /tmp/a6-perf /path/to/base/packages/cli/dist/bin.js
```

It runs ten cold WebP processes per side in alternating pair order and ten
cold MP4 processes with ffmpeg already cached. Every start requires load
below 8. All MP4s must have 180 frames at 1920x1080. WebP pairs must have
identical bytes. Time includes startup, compilation, rendering, encoding,
and publishing, and excludes the first binary download.

Historical results against 0a5501b0 are retained below. They do not replace
the e6741ee9 probe.

| Run                                  | Base WebP median | A6 WebP median |  Ratio | MP4 median |
| ------------------------------------ | ---------------: | -------------: | -----: | ---------: |
| Initial                              |         1.0129 s |       1.0704 s | 1.0568 |   2.3625 s |
| After video-only imports became lazy |         1.0641 s |       1.1430 s | 1.0742 |   2.3278 s |
| Confirmation                         |         1.0309 s |       1.0373 s | 1.0062 |   2.2709 s |

The first two WebP ratios fail the 1.05 rule; the third passes. MP4 passes
6 s in all three. A same-binary control varied by 6.2%, so timing consistency
remains a limitation. All raw results remain under `/tmp/codeimage-a6/` in
`perf`, `perf-balanced`, `perf-confirm`, and `control-perf.json`. An untimed
MP4 V8/native sample is in `profile`; most V8 samples wait for native work
or the pipe. The profile does not isolate the WebP timing difference.

## ffmpeg release and operator note

The pinned release is [b6.1.1](https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1).
All seven compressed assets were downloaded from that release and their
SHA-256 values computed from the actual bytes. The pins in
[checksums.ts](../src/video/checksums.ts) are unchanged by the base merge.
Only darwin-arm64 was executed locally.

The CLI downloads the executable separately and does not bundle it in npm.
The release's platform-specific LICENSE and README are cached beside it.
Appendix C requires operator review of GPL-3.0 handling before merge. The
actual darwin-arm64 asset also reports FFmpeg 6.0 and --enable-nonfree, and
its own ffmpeg -L output says it is not legally redistributable. The operator
must review that additional restriction. The release tag is not the FFmpeg
version string for every platform. No licensing change is made in this merge.

| Asset                    | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `ffmpeg-darwin-arm64.gz` | `8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa` |
| `ffmpeg-darwin-x64.gz`   | `929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106` |
| `ffmpeg-linux-arm.gz`    | `64b115a12f0ab77c277e3c418aae8b40ef881e75e746a0e2d066a206b9bc5172` |
| `ffmpeg-linux-arm64.gz`  | `754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0` |
| `ffmpeg-linux-ia32.gz`   | `169b27c078a8ecedb814cac67afccf15a9868d63e9d74ef86088adefaa500d00` |
| `ffmpeg-linux-x64.gz`    | `bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa` |
| `ffmpeg-win32-x64.gz`    | `8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77` |
