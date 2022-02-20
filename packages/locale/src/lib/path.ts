export type Path<Target, Prefix extends string = ''> = Target extends string
  ? Prefix
  : Path<
      Target[keyof Target],
      `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<keyof Target, string>}`
    >;
