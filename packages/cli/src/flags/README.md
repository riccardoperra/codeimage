Each feature flag is one module here that exports a `Flag` and is listed in
`FLAGS` in `index.ts`. `options` joins the parser, `usage` joins `--help`, and
`apply` transforms the snapshot before rendering. Throw `UsageError` from
`apply` for invalid values so the command exits with 2 and names the flag.

A flag that changes the output files instead of the snapshot, such as split
tabs or alt text, adds an output hook to `Flag` in its own PR.
