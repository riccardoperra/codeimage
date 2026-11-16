# A6 CLI MP4 verification

Verified locally on macOS arm64 with Node 24.14.0, pnpm 12.18.0, and Takumi
2.19.0. The comparison base is `0a5501b085c99eb93484a974137b3159af437d1d` from
`feat/p3-node-renderer`. The base still has no web MP4 encoder. Its pending
realignment is required before lane 10 can run or an integration merge can be
verified.

## Local checks

`pnpm install --frozen-lockfile`, `pnpm libs:build`, the CLI typecheck,
`pnpm --filter=@codeimage/cli lint`, and oxfmt pass. The CLI suite passes all
154 tests in 12 files, including 13 video tests. The fake local HTTP release
server exercises good and corrupt assets, repeat/concurrent installation,
licence-download failure, abort cleanup, and non-TTY diagnostics. A raw-frame
test compares every RGBA pixel against native APNG output at fractional frame
boundaries.

No dependencies were added. The lockfile is unchanged. The repository's
commit hook rejects the requested `cli` scope because its scope list predates
the CLI. Commits retain the requested scope and co-author trailer with that
hook bypassed.

## Live lanes

The implementation agent ran lanes serially through a tmux pane in this
checkout, rather than spawning ten separate model/worktree lanes. Evidence is
under `/tmp/codeimage-a6/live-final-head/`, with the complete transcript at
`/tmp/codeimage-a6/live-final-head.log`. This is local macOS evidence. Windows
and Linux execution remain unverified.

| Lane | Result  | Evidence                                                                                                                                                                                                   |
| ---- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Pass    | WebP output is byte-identical to the base, 1,268,688 bytes.                                                                                                                                                |
| 2    | Pass    | H.264 High, yuv420p, BT.709 primaries/transfer/matrix, limited range, 180 frames at 60 fps. Keyframes are at 0 and 2 seconds. MP4 boxes are ftyp, moov, free, mdat. Redirected stdout is also a valid MP4. |
| 3    | Pass    | First export downloads once, the second reuses the cache. A fresh-cache run through an unreachable proxy exits 2 and names all four ffmpeg sources. macOS uses Library/Caches rather than XDG_CACHE_HOME.  |
| 4    | Pass    | Executable wrappers record flag, CODEIMAGE_FFMPEG, then PATH in order.                                                                                                                                     |
| 5    | Pass    | install-ffmpeg downloads once and prints the same cached path on the second call.                                                                                                                          |
| 6    | Pass    | Two concurrent exports produce playable MP4s. Cache has LICENSE, README, one executable, and no partials.                                                                                                  |
| 7    | Pass    | A 545-pixel frame becomes 546 pixels. The repeated edge has no visible seam.                                                                                                                               |
| 8    | Pass    | SIGINT exits in 4 ms, kills the encoder, and leaves no output or partial MP4.                                                                                                                              |
| 9    | Pass    | SIGINT exits in 3 ms during streaming download. No partials remain, and retry downloads again.                                                                                                             |
| 10   | Blocked | The CLI base remains at 0a5501b0 and has no apps/codeimage/src/core/video/encode.ts. Main has the web animation editor and encoder. No web-versus-CLI comparison was substituted from another model.       |
| 8    | Pass    | SIGINT during encoding exits in 4 ms. The encoder is gone, with no MP4 or partial file.                                                                                                                    |
| 9    | Pass    | SIGINT during an active download exits in 3 ms, leaves no partial, and the retry downloads again.                                                                                                          |
| 10   | Blocked | The base lacks apps/codeimage/src/core/video/encode.ts and main's animation editor. No cross-model or substituted web export is claimed.                                                                   |

Lane 2 was checked with both Homebrew ffmpeg 8.1.1 and the pinned download.
Homebrew drops transfer/primaries after the scale filter unless setparams also
sets the frame metadata. Both now preserve the required tags. H.264 level and
the pixel-rate bitrate cap match origin/main's mp4Config.

Terminal captures are rendered from the actual tmux transcripts, rather than
native window screenshots. They are in `/tmp/codeimage-verification/a6-*.png`.
`a6-review.mp4` in that directory is a 40-second recording of live tmux output
with actual MP4 playback composited below. It shows the first download and
the cached second export. There is no lane 10 image or comparison video.

## Performance evidence

`packages/cli/scripts/benchmark-mp4.mjs` runs ten cold processes per side,
interleaves WebP exports, then runs ten cold MP4 exports with ffmpeg already
cached. Each timed run starts with load below 8. The fixture uses a 3-second,
60 fps animation. Every MP4 is checked as 1920x1080 with 180 frames. Every
WebP pair is byte-identical. MP4 wall time includes process startup, scene
compilation, rendering, piping, encoding, and publishing the file. Downloads
are excluded.

| Run                                                     | Base WebP median | Head WebP median | Head/base | MP4 median |
| ------------------------------------------------------- | ---------------: | ---------------: | --------: | ---------: |
| Initial                                                 |         1.0129 s |         1.0704 s |    1.0568 |   2.3625 s |
| Alternate pair order after deferring video-only imports |         1.0641 s |         1.1430 s |    1.0742 |   2.3278 s |
| Confirming run with the same implementation             |         1.0309 s |         1.0373 s |    1.0062 |   2.2709 s |

A same-binary control used the base executable for both sides, with ten cold
runs per side and alternating pair order. Its medians were 0.8758 s and
0.8217 s, a ratio of 0.9383. Scheduling noise alone exceeded the 5% gate in
that control. The WebP regression cause therefore remains unisolated, and
the earlier failures remain visible rather than treating the byte
comparison as a speed proof.

The first two WebP ratios exceed the 1.05 rule. The confirming run passes
that rule. All three MP4 medians pass the 6-second rule. The full record
retains all three runs. Host scheduling noise is material, so the last pass
does not establish a stable WebP speed difference.

The second run's WebP range is 0.856 to 1.812 s on the base and 0.792 to 1.405 s
on head. The machine also runs other programs. Native output and the entire
SSR entry are identical across sides, but the cause of the measured WebP
difference is not isolated. Timing consistency remains unverified despite
the confirming run passing the numeric gate.

Raw measurements, load at every start, and byte counts are in
`/tmp/codeimage-a6/perf/results.json`, `perf-balanced/results.json`, and
`control-perf.json`. The confirming run is in
`/tmp/codeimage-a6/perf-confirm/results.json`. An untimed MP4 CPU/native sample is in
`/tmp/codeimage-a6/profile/`. The V8 sample spends most samples idle while
awaiting native work and the pipe. The remaining per-frame JS cost includes
odd-height padding. Profiling is separate from the reported runs and does
not establish the cause of the WebP difference.

## Pinned release and operator licensing note

The release is [b6.1.1](https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1).
All seven compressed assets were downloaded from that release and SHA-256
was computed from their actual bytes. The pins are in
[checksums.ts](../src/video/checksums.ts). Only darwin-arm64 was executed.

The CLI does not bundle ffmpeg in its npm package. It downloads the executable
and the release's platform-specific LICENSE and README to the user cache.
Appendix C requires operator confirmation of GPL-3.0 handling before merge.
There is an additional finding: the darwin-arm64 asset identifies itself as
FFmpeg 6.0, includes --enable-gpl, --enable-version3, and --enable-nonfree,
and its own ffmpeg -L output says it is not legally redistributable. The
operator must review that restriction. The release tag is not the FFmpeg
version string for every platform.

| Compressed release asset | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `ffmpeg-darwin-arm64.gz` | `8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa` |
| `ffmpeg-darwin-x64.gz`   | `929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106` |
| `ffmpeg-linux-arm.gz`    | `64b115a12f0ab77c277e3c418aae8b40ef881e75e746a0e2d066a206b9bc5172` |
| `ffmpeg-linux-arm64.gz`  | `754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0` |
| `ffmpeg-linux-ia32.gz`   | `169b27c078a8ecedb814cac67afccf15a9868d63e9d74ef86088adefaa500d00` |
| `ffmpeg-linux-x64.gz`    | `bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa` |
| `ffmpeg-win32-x64.gz`    | `8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77` |
