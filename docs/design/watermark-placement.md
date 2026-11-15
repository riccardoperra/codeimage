# Watermark placement

The existing CodeImage watermark stays in its original bottom-right position while that position is clear of code. Its SVG, width, opacity and theme remain unchanged. A collision triggers a deterministic search for another position.

The ordered candidates are the bottom-right, bottom-left, top-right and top-left of the frame, followed by the top-right of the content. As a last resort it tries the right and left ends of the title bar. Every candidate must contain the complete logo and clear the measured text and controls. Frame candidates must also clear the window and the signature's visible mark. Hidden or transparent frame backgrounds cannot host the logo.

When every candidate is occupied, the watermark stays in its original position. The algorithm does not grow the window, shrink the logo or hide it. A completely occupied window with no painted frame can therefore retain the original overlap.

## Usage and ownership

`DynamicTerminal` renders one `Watermark`. The component measures non-whitespace text fragments with DOM Ranges, including wrapped fragments. It measures tab and control boxes separately. Full-width code-line elements are not treated as text.

`placeWatermark(scene)` in `core/watermark/placement.ts` accepts geometry and returns the original position, an anchored alternative or the explicit unavoidable case. It has no DOM, framework or persisted state. Repeating the calculation on the same scene produces the same result.

The component preserves an empty home anchor while the single SVG renders through a Portal at the chosen host. This escapes the content and window clipping without changing their overflow rules. Positions convert viewport geometry back to the host's coordinates, retaining the fitted-window scale.

Resize, content, style, font and scroll changes schedule one measurement on the next animation frame. Cleanup disconnects observers and listeners. `prepareWatermarks(root)` settles the relevant frame before the common image-export path calls either DOM export or Takumi. Each per-tab preview owns its own measurement lifecycle.

## Design decision

The selected design combines fixed ranked positions with local component ownership. A continuous search through arbitrary whitespace was rejected because it can move the logo after small edits and place it among code. Placement history was rejected because a newly mounted per-tab export must make the same decision as an existing frame from the same geometry.

No stage-wide placement provider, duplicate hidden SVG or new user setting is needed. The browser measurement adapter handles zoom and DOM details. The pure function owns collision and placement policy.

The CLI renderer `render/entry-server.tsx` is absent from this checkout. A future adapter can supply geometry to the same pure function. Animated capture requires an occupancy envelope for the complete animation and is not integrated here.

## Verification

Run the focused browser journey with:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=watermark node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The journey drives window styles and code through the UI, records live/export geometry, and downloads images. Its mock backend boundary is the same as the rest of the verification skill. Policy tests cover unchanged positioning, blocked controls, signature collision, unavailable frame space and scaling.
