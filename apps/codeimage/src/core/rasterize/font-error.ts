export type ExportFontFailure =
  | 'unavailable'
  | 'read'
  | 'format'
  | 'registration'
  | 'collection';

export class ExportFontError extends Error {
  constructor(
    readonly family: string,
    readonly reason: ExportFontFailure,
    cause?: unknown,
  ) {
    super(`Export font unavailable: ${family} (${reason})`, {cause});
    this.name = 'ExportFontError';
  }
}
