# Secrets review and redaction

Review possible credentials before sending code into images.

## Sub-features

Editor warnings with inline Redact/Ignore; export review; Redact all from the review or the Export menu; destructive redaction and undo.

## How to get to it (user POV)

Enter a synthetic api_key assignment, then press Export or another image action. Copy alt text is a separate clipboard action and does not use this image-review gate.

## Driving it with Playwright

Audit fills a synthetic key, clicks `[data-export-image]`, awaits the alertdialog named `Export image` and captures review before closing. Its buttons are Redact all, Close and Export anyway; after Redact all they become Close and Confirm and the dialog reads "Secrets redacted. Ready to export." The inline warning tooltip names its actions `Action: Redact.` and `Action: Ignore.`; match the button text instead of an exact accessible name. Inline Redact masks the value with bullets and Cmd/Ctrl+Z restores it. On a one-line snippet the window watermark can sit over the end of the line and intercept pointer hover, so put the key on the first of several lines. The journey then reopens review, chooses Redact all, asserts the code is masked and downloads the result. Check no download occurs before confirmation. Never use real credentials in fixtures or evidence.

Source: `components/CustomEditor/plugins/secrets/index.ts`, `pages/UnifiedEditor/shell/export.tsx`, `pages/UnifiedEditor/shell/ExportControl.tsx`.

The executable secrets journey counts real download events. It closes review and asserts zero downloads, reopens it, chooses Redact all, asserts bullets and absence of the synthetic key, then confirms and decodes exactly one downloaded PNG.

## Gotchas

Review is advisory detection, not proof every secret is recognized. Redaction edits all affected documents; it is not merely an export filter. Undo covers the active tab only; other tabs are rewritten without history. Synthetic fixture matches existing verify-review.mjs. Clipboard/new-tab/share need their own gate checks when changed.
