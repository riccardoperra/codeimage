# Secrets review and redaction

Review possible credentials before sending code into images.

## Sub-features

Editor warnings; Redact/Ignore; export review; destructive redaction and undo.

## How to get to it (user POV)

Enter a synthetic api_key assignment, then press Export or another image action. Copy alt text is a separate clipboard action and does not use this image-review gate.

## Driving it with Playwright

Audit fills a synthetic key, clicks `[data-export-image]`, awaits alertdialog and captures review before closing. The journey then reopens review, chooses Redact all, asserts the code is masked and downloads the result. Check no download occurs before confirmation. Never use real credentials in fixtures or evidence.

Source: `components/CustomEditor/plugins/secrets/index.ts`, `prototypes/editor-controls/shell/export.tsx`, `shell/ExportControl.tsx`.

The executable secrets journey counts real download events. It closes review and asserts zero downloads, reopens it, chooses Redact all, asserts bullets and absence of the synthetic key, then confirms and decodes exactly one downloaded PNG.

## Gotchas

Review is advisory detection, not proof every secret is recognized. Redaction edits all affected documents; it is not merely an export filter. Synthetic fixture matches existing verify-review.mjs. Clipboard/new-tab/share need their own gate checks when changed.
