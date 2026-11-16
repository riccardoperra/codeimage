# A6 CLI MP4 verification

The comparison base is `5fb5abefaa6b1d94db9edbdc9de2b22cccbbb341` on
`feat/p3-node-renderer`. Merge commit `9e7742cc07f9b0d85c60479cf70ff4c27187f956`
merges that base into A6 with two parents. The merge needed no conflict edits.
The additive raw-frame API is intact. A6 leaves the existing encoded animation
function unchanged and adds no dependencies or lockfile changes relative to
this base. The ffmpeg download sources and checksum pins are unchanged.

Verification uses macOS arm64, Node 24.14.0, pnpm 12.18.0, Takumi 2.19.0, and
Chrome 157.0.8103.78. The CLI baseline is an isolated source archive of 5fb5abef
with its own frozen install and library build. The web server uses a separate
archive of current main `f7dfb63153ad0bcc9b7e1d953d9518bdfe047fce`.
Those archives and current evidence are under `/tmp/codeimage-a6-canvas/`.

## Local checks

Frozen install and `pnpm libs:build` pass on the merged branch, base archive,
and main archive. All 160 CLI tests in 12 files pass, including 13 video
tests. CLI typecheck, lint, and oxfmt pass. Logs are `tests.log`,
`typecheck.log`, `lint.log`, and `format.log` in the evidence directory.
The fake local release server tests integrity failure, repeat and concurrent
installation, licence failure, cancellation cleanup, and non-TTY stderr.
Raw RGBA frames still match every native APNG frame at fractional scene
boundaries. The shared clock extends that test clip from 375 ms to 400 ms,
so its duration assertion now expects 400 ms. No production change was needed.

The legacy commit hook rejects the requested `cli` scope. Commits retain that
scope and the requested co-author trailer with that hook bypassed.

## Live lanes

Lanes 1 and 2 were rerun against 5fb5abef. Lane 10 was rerun against main
f7dfb631 for the web and this merged branch for the CLI. Lanes 3 through 9
retain the earlier e6741ee9 evidence and were not rerun for this merge.
These are local serial runs, not ten delegated model lanes. Windows and
Linux execution remain unverified.

| Lane | Revision                   | Result and evidence                                                                                                                                                  |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 5fb5abef                   | Pass. WebP is byte-identical to the unmodified base, 70,578 bytes.                                                                                                   |
| 2    | 5fb5abef                   | Pass. H.264 High, yuv420p, all BT.709 tags and limited range. 180 frames at 60 fps, keyframes at 0 and 2 s, moov before mdat. Redirected stdout is also a valid MP4. |
| 3    | e6741ee9                   | Pass. First export downloads once, second reuses cache. Fresh-cache offline export exits 2 and lists all four ffmpeg sources. macOS uses Library/Caches.             |
| 4    | e6741ee9                   | Pass. Wrappers record flag, environment, then PATH in order.                                                                                                         |
| 5    | e6741ee9                   | Pass. Installation downloads once and prints the same binary path twice.                                                                                             |
| 6    | e6741ee9                   | Pass. Concurrent exports both play; cache has one executable, LICENSE, README, and no partials.                                                                      |
| 7    | e6741ee9                   | Pass. A 545 px raw frame encodes at 546 px with its edge repeated.                                                                                                   |
| 8    | e6741ee9                   | Pass. SIGINT exits in 12 ms, with no encoder, output MP4, or partial file.                                                                                           |
| 9    | e6741ee9                   | Pass. Download SIGINT exits in 6 ms, leaves no partial, and retry downloads again.                                                                                   |
| 10   | 5fb5abef CLI, f7dfb631 web | Pass in all five Current frame comparisons below.                                                                                                                    |

Current lane 1 and 2 results are in `lanes12/results.json` and `lanes12.log`.
Historical lane 3 through 9 results remain in
`/tmp/codeimage-a6-realigned/live/results.json` and `live.log`.

## Web and CLI MP4 comparison

Each case starts with a fresh Chrome profile and creates the project through
visible controls. The first tab has one line, `let a = 1;`. The second has
12 lines and ends with `BOTTOM_SENTINEL_WWWWWWWWWWWWW`, so the steps have
different natural sizes. The window style is Editor, the export target is
Current frame, and scale is 1×. The web export is downloaded through the MP4
dialog. The helper then reads the actual saved guest project from IndexedDB
without changing its values and passes that exact JSON to
`codeimage project.json --animate --scale 1 -o cli.mp4`.

`ffprobe` confirms matching dimensions, frame counts, frame rates, durations,
H.264 High profile, yuv420p, and BT.709 limited colour tags in every case.
All five videos on each side are 640×508. Seven corresponding frames per
case include holds and transitions. Pixelmatch threshold is 0.1; the pass
limit is 2% per sampled frame.

| Case                                  | fps | Frames, both files | Duration, both files | Maximum sampled difference | Evidence folder           |
| ------------------------------------- | --: | -----------------: | -------------------: | -------------------------: | ------------------------- |
| Unequal steps, visible frame          |  30 |                 69 |           2.300000 s |                  1.282911% | `lane10-unequal-30-retry` |
| Unequal steps, hidden frame           |  30 |                 69 |           2.300000 s |                  1.007320% | `lane10-hidden-30`        |
| Unequal steps, signature `@step_size` |  30 |                 69 |           2.300000 s |                  1.434855% | `lane10-signature-30`     |
| Unequal steps, visible frame          |  24 |                 56 |           2.333333 s |                  1.185101% | `lane10-unequal-24`       |
| Unequal steps, visible frame          |  50 |                115 |           2.300000 s |                  0.737266% | `lane10-unequal-50`       |

The inherited web transition watermark re-placement, tab accent colours, and
faint incoming CLI tokens remain visible. None breaks the 2% bound in these
samples. The previous Current frame dimension mismatch and clipping are
resolved by the shared canvas work in the new base. No A6 workaround or web
fix was added. The earlier Square comparison is historical evidence only,
retained under `/tmp/codeimage-a6-realigned/lane10-square/`.

Each current case folder contains `project.json`, both MP4s, decoded frame
pairs, difference PNGs, `metadata.json`, `result.json`, screenshots, and a
Playwright trace. These are real local web runs with MSW and development
authentication; they do not verify production API or OAuth. The shared T3
preview was attempted first. Two snapshots failed with "The browser is not
producing screenshot frames", so the verifier used an owned Chrome profile
and removed it afterward. The initial `lane10-unequal-30` attempt records a
helper selector timeout before export; the successful retry uses the
observed Frame rate control name.

The helper is `packages/cli/scripts/verify-web-mp4.mjs`. Against an owned web
server built from the recorded revision, replay each case with:

```sh
A6_CASE=unequal A6_FPS=30 A6_WEB_HEAD=f7dfb63153ad0bcc9b7e1d953d9518bdfe047fce node packages/cli/scripts/verify-web-mp4.mjs http://127.0.0.1:4467 /tmp/a6-parity
```

Set `A6_CASE` to `hidden` or `signature`, or `A6_FPS` to `24` or `50`, and
use a different evidence directory for each run. The helper asserts the
saved visibility, signature, natural export target, code, and frame rate.
It compares ffprobe metadata and records differences before checking the
pixel bound.

The current web export screenshot is
`/tmp/codeimage-verification/a6-review-web-vs-cli-current-frame.png`.
Terminal PNGs from earlier runs are rendered transcripts. The 40-second
`a6-review.mp4` in that directory is the earlier live tmux recording with
actual playback, and predates both base realignments.

## Performance

These timings predate the 5fb5abef merge and are not a new performance
measurement of that merge. The e6741ee9 probe passes both numeric gates. Ten interleaved WebP pairs are
byte-identical, and all ten cached MP4 exports have 180 frames at 1920x1080.
Every timed process starts with load below 8, ranging from 7.219 to 7.941.
The machine also runs other programs, so these remain shared-host timings.

| Metric            |     Base |       A6 | Rule                 | Result       |
| ----------------- | -------: | -------: | -------------------- | ------------ |
| WebP median       | 0.8839 s | 0.8927 s | A6/base at most 1.05 | Pass, 1.0099 |
| Cached MP4 median |      n/a | 2.2377 s | At most 6 s          | Pass         |

Base WebP runs range from 0.8559 to 1.0291 s; A6 WebP runs range from
0.8271 to 1.0420 s. MP4 runs range from 1.8635 to 4.2556 s. Raw measurements,
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
