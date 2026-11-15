export const formatSeconds = (ms: number, locale: string) =>
  `${new Intl.NumberFormat(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(ms / 1000)} s`;
export const formatDuration = (ms: number, locale: string) =>
  `${new Intl.NumberFormat(locale).format(ms)} ms`;
