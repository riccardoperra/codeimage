# CLI MP4 encoding

Exercise H.264 metadata, faststart ordering, stdout output, missing/unsupported encoders, flag/environment/PATH precedence, concurrent outputs, odd widths, SIGINT cleanup and other formats without FFmpeg. Supplying a prior binary also checks byte-identical WebP output.

Source entry points (repository-relative): packages/cli/src/flags/animate.ts, packages/cli/src/video/ffmpeg.ts.

## Prerequisites and launch

Node 24, built CLI, ffmpeg with libx264 and ffprobe. A6_FFMPEG and A6_FFPROBE override their paths. pgrep is required for encoder cleanup. Each lane writes results.json even on failure.

From the repository root:

```sh
node .agents/skills/verify-codeimage/scripts/cli/mp4/index.mjs /tmp/codeimage-mp4 [before/dist/bin.js]
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
