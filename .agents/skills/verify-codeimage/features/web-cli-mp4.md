# Web and CLI MP4 parity

The web-mp4 audit case edits two unequal tabs through the UI, opens Animate and exports a real MP4. It reads the saved project without mutating stores, exports it with the CLI, checks H.264 metadata and compares seven decoded frames at a maximum 2% pixel difference. A6_CASE=unequal|hidden|signature covers natural, hidden-frame and signature variants. A6_FPS selects the frame rate.

Source entry points (repository-relative): apps/codeimage/src/hooks/use-export-animation.ts, packages/cli/src/flags/animate.ts.

## Prerequisites and launch

Use the owned verify.mjs launch and doctor with MSW, installed Chrome for WebCodecs, built CLI, ffmpeg and ffprobe in PATH (or A6_FFMPEG/A6_FFPROBE). The shared trace, settings screenshot, videos, project, metadata, frame diffs and web-cli-mp4.json stay in ARTIFACT_DIR.

From the repository root:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=web-mp4 VERIFY_BROWSER_CHANNEL=chrome ARTIFACT_DIR=/tmp/codeimage-web-mp4 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
