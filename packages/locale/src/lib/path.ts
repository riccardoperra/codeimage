type Path<Target, Prefix extends string = ''> = Target extends string
  ? Prefix
  : Path<
      Target[keyof Target],
      `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<keyof Target, string>}`
    >;

export type ExtractLocaleKeys<T> = T extends Record<string, infer U>
  ? U
  : never;

export type LocaleKeys<T> = Path<ExtractLocaleKeys<T>>;
