# Reusable signatures

Add a handle to exported snippets and save reusable signatures.

## Sub-features

Minimal/Pill/Card, icon/name/avatar (Initials/Profile/Upload)/position; save/apply/update/rename/set or remove default/delete; limit `VITE_SIGNATURE_LIMIT`, three by default.

## How to get to it (user POV)

Open Frame then Signature (`#signature-options`); after creation the canvas signature is another entry.

## Driving it with Playwright

The `signatures` case clicks `#signature-options` (the open overlay is `[data-control-overlay="signature"]`), fills @handle or profile link, chooses Saved signatures → Save as new → group Signature name → its textbox → Save. Assert `[data-frame-signature]` contains the handle; export PNG. Reload same context, open Saved signatures and apply named menuitem to prove persistence. Card exposes display name/avatar. Choose Initials for local proof.

Source: `pages/UnifiedEditor/controls/SignatureFields.tsx`, `controls/SavedSignatures.tsx`, `state/signatures/bridge.ts`.

Run `signature-management` to create its own saved signature, assert the Pill canvas attribute, rename the saved record and delete it through the menu. It has no dependency on a previous case. Default signatures and avatar sources remain separate coverage. At the limit, menuitem Save as new is aria-disabled and a note reads "You can keep 3 signatures. Delete one to save another."; no audit case asserts it.

## Gotchas

Saved guest signatures persist in IndexedDB; signed-in ones use API. Current unsaved snippet persistence is a separate claim. Profile avatars require network and fall back to initials. Save/delete reusable entries does not retroactively change existing snippet copies.
