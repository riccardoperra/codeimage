# A6 CLI MP4 verification

MP4 requires user-installed ffmpeg with libx264. The CLI resolves it from
`--ffmpeg <path>`, `CODEIMAGE_FFMPEG`, then PATH. A `--ffmpeg` path that
is not an executable file exits 2 without falling back. An invalid
`CODEIMAGE_FFMPEG` prints a warning and falls back to PATH. On Windows it also checks
`%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe` after PATH. The selected
executable must list libx264 in `ffmpeg -hide_banner -encoders`.

Install the prerequisite before unattended or CI exports:

```sh
# macOS, with Homebrew: https://brew.sh
brew install ffmpeg
# Windows
winget install --id Gyan.FFmpeg -e --source winget
# Linux, using your distro package manager
sudo apt install ffmpeg
sudo dnf install ffmpeg
sudo pacman -S ffmpeg
```

Interactive MP4 exports on macOS or Windows offer a confirmation only when
brew or winget is already on PATH. Confirmed installation inherits stdio,
then resolution and the libx264 check run again before rendering. Missing
package managers produce instructions. Linux, CI, non-TTY, and quiet sessions
print instructions and exit 2 without prompting or running a package manager.
Declining or cancelling also exits 2. There is no dedicated installation
command. PNG, GIF, WebP, and APNG do not check for ffmpeg.

## Revisions and environment

Implementation commit `b0c21927` replaces ffmpeg provisioning with the
prerequisite flow. It builds on merge commit
`9e7742cc07f9b0d85c60479cf70ff4c27187f956`, which merged CLI base
`5fb5abefaa6b1d94db9edbdc9de2b22cccbbb341`. The raw-frame API and existing
encoded animation function are unchanged by this prerequisite change.

The web comparison uses an isolated source archive of current main
`45f68cd73a9f6c7acad00b26a480ca9dfbcc2e21`, built with a frozen install and
`pnpm libs:build`. Local verification uses macOS arm64, Node 24.14.0,
pnpm 12.18.0, and Takumi 2.19.0. ffmpeg 9.0.2 resolves from
`/opt/homebrew/bin/ffmpeg` on PATH; CODEIMAGE_FFMPEG is unset and no --ffmpeg
flag is passed in lane 10. Evidence is under
`/tmp/codeimage-a6-prerequisite/`.

No dependencies were added or removed. pnpm-lock.yaml is unchanged.
The legacy commit hook rejects the requested cli scope, so commits retain
that scope and the required co-author trailer with that hook bypassed.

## Local checks

`pnpm libs:build`, CLI typecheck, lint, and oxfmt pass. All 173 unit tests in
12 files pass: the 153 retained baseline tests plus 20 prerequisite tests.
The raw-frame test still compares every frame against native APNG at
fractional scene boundaries and expects the shared clock's 400 ms duration.

The setup tests mock filesystem discovery, spawn, and the prompts used by
`createUi`. They cover flag/environment/PATH priority, Windows WinGet Links,
libx264 versus libx264rgb, failed encoder probes, brew and winget confirmation,
inherited stdio, resolution after installation, cancellation, missing package
managers, installer failure, missing ffmpeg after installation, each non-TTY
stream, CI, and Linux instructions without sudo execution. Native package
installation was not performed. Windows and Linux behavior is unit-tested,
but native execution on those platforms remains unverified.

Logs are `build.log`, `tests.log`, `typecheck.log`, `lint.log`, and
`format.log` in the evidence directory.

## Live lanes

Lanes 1 through 9 ran locally and serially with the updated helper. Results
are in `live-complete/results.json`; the transcript is `live-complete.log`.
The new prerequisite cases replace the earlier provisioning lanes.

| Lane | Result and evidence                                                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Pass. WebP is byte-identical to unmodified base 5fb5abef, 70,578 bytes.                                                                                                    |
| 2    | Pass. PATH ffmpeg produces H.264 High, yuv420p, BT.709 limited range, 180 frames at 60 fps, keyframes at 0 and 2 s, and moov before mdat. Redirected stdout is also valid. |
| 3    | Pass. Missing ffmpeg in a non-TTY environment exits 2, prints installation instructions and executable hints, and leaves no MP4.                                           |
| 4    | Pass. Wrappers prove flag, environment, then PATH priority. A missing `--ffmpeg` path exits 2 instead of using PATH.                                                       |
| 5    | Pass. An executable listing only libx264rgb exits 2 with the libx264 requirement before rendering.                                                                         |
| 6    | Pass. Concurrent exports both play and leave no partial output files.                                                                                                      |
| 7    | Pass. A naturally 909 px APNG frame encodes at 910 px with its edge repeated, at scale 1.                                                                                  |
| 8    | Pass. SIGINT exits and completes cleanup in 8 ms, with no encoder or partial MP4 remaining.                                                                                |
| 9    | Pass. PNG, GIF, WebP, and APNG complete with ffmpeg unavailable.                                                                                                           |
| 10   | Pass. Three web and CLI MP4 comparisons below use the exact same saved JSON per case.                                                                                      |

The first live passes exposed two helper assumptions. Lane 7's old
fractional-scale APNG probe fails on the current base with a floating-point
size rejected by Takumi. The updated fixture creates an odd natural width at
scale 1. Lane 8 initially checked a killed PID before the OS reaped it. The
helper now waits for encoder removal within the original one-second deadline.
No production renderer or signal-handling change was needed. Failed attempts
remain in `live/` and `live-final/` rather than being overwritten.

## Web and CLI MP4 comparison

Lane 10 ran through the shared T3 preview on current web main with MSW and
development authentication. All edits used visible controls. The first tab
contains `let a = 1;`; the second has 12 lines ending with
`BOTTOM_SENTINEL_WWWWWWWWWWWWW`. The steps have different natural sizes. The
window style is Editor, the target is Current frame, and export scale is 1×.
The frame is visible in the first case, hidden in the second, and visible
with signature @step_size in the third.

After each real web MP4 download, the saved guest project was read from
IndexedDB without modifying its values. That JSON was passed directly to
`codeimage project.json --animate --scale 1 -o cli.mp4`. ffprobe confirms
matching H.264 High, yuv420p, BT.709 limited colour tags, dimensions, frame
rate, frame count, and duration. Each file is 640×508, 30 fps, 69 frames,
and 2.300000 seconds.

Seven corresponding decoded frames per case include holds and transitions.
Pixelmatch threshold is 0.1; the pass limit is 2% per sampled frame.

| Case                                | Maximum sampled difference | Evidence folder    |
| ----------------------------------- | -------------------------: | ------------------ |
| Unequal steps, visible frame        |                  1.261996% | `lane10-visible`   |
| Unequal steps, hidden frame         |                  0.867680% | `lane10-hidden`    |
| Unequal steps, signature @step_size |                  1.457000% | `lane10-signature` |

Inherited transition watermark placement, tab accent colours, and faint
incoming CLI tokens remain visible, within the bound in these samples.
These runs do not verify production API or OAuth.

Each case folder contains project.json, both MP4s, decoded frame pairs,
difference PNGs, ffprobe metadata.json, result.json, and a web screenshot.
`compare.mjs` in the evidence directory uses the comparison section from the
checked-in `packages/cli/scripts/verify-web-mp4.mjs`. The browser journey can
also be replayed with that checked-in helper against an owned web server:

```sh
A6_CASE=signature A6_WEB_HEAD=45f68cd73a9f6c7acad00b26a480ca9dfbcc2e21 node packages/cli/scripts/verify-web-mp4.mjs http://127.0.0.1:4473 /tmp/a6-parity
```

Set A6_CASE to unequal or hidden for the other cases and use a fresh evidence
directory. Set A6_FPS to change the default 30 fps. ffmpeg and ffprobe must
already be on PATH. The screenshots and decoded frames remain under the
current evidence directory. The shared preview tabs and owned web server
were closed after verification.

## Performance

No new performance claim is made for the prerequisite change. The earlier
probe against e6741ee9 used ten interleaved cold WebP runs per side and ten
MP4 runs. Its base WebP median was 0.8839 s, A6 WebP median was 0.8927 s,
and ratio was 1.0099. Base WebP range was 0.8559 to 1.0291 s; A6 WebP range
was 0.8271 to 1.0420 s. MP4 median was 2.2377 s, with range 1.8635 to
4.2556 s. Every timed process started at load below 8.
Those measurements predate this change. Raw results remain in
`/tmp/codeimage-a6-realigned/perf/results.json`.

The updated `packages/cli/scripts/benchmark-mp4.mjs` uses user-installed
ffmpeg on PATH and waits for load below 8 before each cold process. It checks
identical WebP bytes and 180-frame 1920×1080 MP4 output. Time includes startup,
compilation, prerequisite validation, rendering, encoding, and publishing.
