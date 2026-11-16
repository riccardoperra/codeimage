type Path<Target> = {
  [Key in Extract<keyof Target, string>]: Target[Key] extends string
    ? Key
    : `${Key}.${Path<Target[Key]>}`;
}[Extract<keyof Target, string>];

export type ExtractLocaleKeys<T> =
  T extends Record<string, infer U> ? U : never;

export type LocaleKeys<T> = Path<ExtractLocaleKeys<T>>;
