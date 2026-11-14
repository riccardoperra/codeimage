# P7 verification on P1

P7 is stacked on P1 at `17233c9353d5f1f7c27eaeab50470a5a3eb21c0d`. `PreviewFrame` keeps P1's `StaticCodeView`, language input, and per-tab input inside P7's `FittedWindow`. Named targets control the pixel dimensions. Free-size per-tab previews retain P1's automatic dimensions. `export-snippet.ts` is unchanged from P1, and `exportImage` remains the only export pixel-ratio decision.

The API integration run found that Fastify coerced a null aspect ratio into an empty string. The P7 aspect-ratio schema now checks null before string. Two Fastify request tests cover null and `16:9`. The existing database update test confirms that null, target, and signature round-trip together.

## Live verification

Run on 2026-11-14 with Playwright Chromium 1200, a 1440 by 1000 viewport, and Chrome's `--force-device-scale-factor=1` launch flag. No emulated device scale factor was set. Both servers used mock auth and MSW. Trunk was `27b185f1`; its app and rendering packages match current main. Head ran on port 4425 and trunk on 4426.

| Lane | Result |
| --- | --- |
| 1 | Both 16:9 PNGs are 832 by 468. Pixelmatch reports zero differing pixels. |
| 2 | Downloaded PNGs are exactly 1600 by 900, 1080 by 1080, 1080 by 1350, and 1200 by 630. |
| 3 | All 60 lines render in the static export view. The window fits inside the 1600 by 900 frame at scale 0.53723. |
| 4 | Both signature corners are correct, inside the editor and export frames, and clear of the code window. |
| 5 | The 40-character handle occupies x=1179.4 through x=1576 in the 1600-pixel export. |
| 6 | A UI-saved preset restores X landscape and the bottom-left `@preset` signature in a fresh browser context and exports at 1600 by 900. |
| 8 | A 1600 by 900 center crop contains the 60-line window and signature. The signature starts 15.9 pixels below the window. |
| 9 | A 120-pixel free-size drag changes width from 621 to 741 on both trunk and head. Both PNGs are 741 by 446. |
| 10 | The downloaded Open Graph JPEG is exactly 1200 by 630. |

[Raw measurements](p7-stack-evidence.json), [target picker](media/p7-stack-targets.png), [signature export](media/p7-stack-signature.png), and [60-line crop](media/p7-stack-crop.png) are committed with this report. Scripts, every download, screenshots, and logs remain in `/tmp/swarm-p7-stack/`. `node /tmp/swarm-p7-stack/tools/assert.cjs` checks the captured lane results. `tools/lanes.cjs`, `tools/lane6.cjs`, and `tools/crop.cjs` rerun the browser checks against the two development servers.

## Build and tests

- `pnpm install` and `pnpm libs:build` pass. Regenerating the lockfile after Prisma generation leaves no lockfile changes.
- `pnpm --filter=@codeimage/config test` passes all 5 tests.
- `pnpm --filter=@codeimage/app test` passes all 10 tests.
- `pnpm --filter=@codeimage/api test:unit` passes all 33 tests.
- `pnpm --filter=@codeimage/api test:integration --testTimeout=60000 --hookTimeout=60000 --reporter=verbose` passes all 17 tests against isolated local Postgres, including migration deployment and the updated project round-trip.
- `pnpm lint` passes with 33 existing warnings and zero errors.
- `pnpm typecheck` passes after generating Prisma models and running `pnpm --filter=@codeimage/api build:ts` to produce the API declarations required by the app.

## Scope and environment

Lane 7 remains deferred with the CLI flags. Performance was not rerun in this stacking task; the earlier performance limitation in PR #696 remains. This rerun does not replace the operator's review or authorize a merge.

Another task occupied IPv4 port 4425. The head server used IPv6, and Chrome mapped `localhost` to `::1` with `--host-resolver-rules=MAP localhost [::1]`. This avoids MSW's failure to parse a bracketed IPv6 origin. The browser check asserts that the head contains P1's static view. Both servers used the installed MSW worker during the run; the tracked workers were restored afterward. The copied app environment and local database configuration remain ignored by Git. The isolated database was removed after verification.
