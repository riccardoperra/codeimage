# Reusable signatures

Add a handle to exported snippets and save reusable signatures.

## Sub-features

Minimal/Pill/Card, icon/name/avatar/position; save/apply/update/rename/default/delete, limit three.

## How to get to it (user POV)

Open Frame then Signature (`#signature-options`); after creation the canvas signature is another entry.

## Driving it with Playwright

Audit opens `[data-control-overlay="signature"]`, fills @handle or profile link, chooses Saved signatures → Save as new → group Signature name → its textbox → Save. Assert `[data-frame-signature]` contains handle and style; export PNG. Reload same context, open Saved signatures and apply named menuitem to prove persistence. Card exposes display name/avatar. Choose Initials for local proof.

Source: `prototypes/editor-controls/controls/SignatureFields.tsx`, `controls/SavedSignatures.tsx`, `state/signatures/bridge.ts`.

## Gotchas

Saved guest signatures persist in IndexedDB; signed-in ones use API. Current unsaved snippet persistence is a separate claim. Profile avatars require network and fall back to initials. Save/delete reusable entries does not retroactively change existing snippet copies.
