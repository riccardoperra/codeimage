# Reusable signatures

Add a handle to exported snippets and save reusable signatures.

## Sub-features

Minimal/Pill/Card, icon/name/avatar (Initials/Profile/Upload)/position; save/apply/update/rename/set or remove default/delete; limit `VITE_SIGNATURE_LIMIT`, three by default.

## How to get to it (user POV)

Open Frame then Signature (`#signature-options`); after creation the canvas signature is another entry.

## Driving it with Playwright

The `signatures` case opens Signature with Enter and fills the handle. It opens Saved signatures with ArrowDown. Escape first dismisses the menu and returns focus to Saved signatures. A second Escape dismisses Signature and returns focus to its opener.

The case reopens Signature, saves a new signature, checks the canvas handle, and decodes the downloaded PNG. It reloads the same context and selects the saved signature to check persistence. Card exposes the display name and avatar. Choose Initials for a local check.

Source: `pages/UnifiedEditor/controls/SignatureFields.tsx`, `controls/SavedSignatures.tsx`, `state/signatures/bridge.ts`.

Run `signature-management` to create its own saved signature, assert the Pill canvas attribute, rename the saved record and delete it through the menu. It has no dependency on a previous case. Default signatures and avatar sources remain separate coverage. At the limit, menuitem Save as new is aria-disabled and a note reads "You can keep 3 signatures. Delete one to save another."; no audit case asserts it.

## Gotchas

Saved guest signatures persist in IndexedDB; signed-in ones use API. Current unsaved snippet persistence is a separate claim. Profile avatars require network and fall back to initials. Save/delete reusable entries does not retroactively change existing snippet copies.
