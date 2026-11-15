# @codeimage/secrets

`detectSecrets(text)` returns sorted, non-overlapping UTF-16 ranges with `from`, `to`, `ruleId`, and `keepPrefix`. `redactSecrets(text)` replaces matched characters with `•`, preserving public prefixes, line breaks, and UTF-16 length. Both functions are pure and have no runtime dependencies.

The provider patterns are adapted from the [Gitleaks default configuration](https://raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml). Rule IDs and token shapes are retained. JavaScript named captures select the secret value, and token boundaries avoid matching truncated values. The package is MIT licensed (see [LICENSE](./LICENSE)); the Gitleaks MIT notice is in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

Provider rules keep the Gitleaks entropy minimums and the AWS `EXAMPLE` allowlist, so placeholders such as `ghp_xxxx…` are not reported. CodeImage adds connection URL passwords and generic assignments. Generic values require at least 12 characters and Shannon entropy of at least 3.5 bits per character. Placeholders, environment references, prose, URLs, and unquoted code expressions are excluded. Every pattern scans in linear time, so a long minified line cannot stall the editor. These hints cannot detect every secret.

Specific provider rules take precedence over generic assignments. A private key block or connection password takes precedence over any token inside it. PEM line breaks are preserved. Already masked values are not reported again.

Run `pnpm --filter=@codeimage/secrets test` for rule and redaction tests. Run `pnpm --filter=@codeimage/secrets bench` for a 2,000-line scan with five warm-ups and 30 measured runs. Every run checks the number of detected tokens before accepting the timing.
