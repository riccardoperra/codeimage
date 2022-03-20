type GetArrayObject<T extends readonly Record<string, unknown>[]> = T[number];

type GetStringObjectKeys<T> = keyof Pick<
  T,
  {
    readonly [K in keyof T]-?: T[K] extends string ? K : never;
  }[keyof T]
>;

type LookUp<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  U extends Record<string, any>,
  K extends keyof U,
  T extends string,
> = U extends U ? (U[K] extends T ? U : never) : never;

export function mapToDictionary<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TArray extends readonly Record<string, any>[],
  TObject extends GetArrayObject<TArray> = GetArrayObject<TArray>,
  TKeys extends keyof TObject = GetStringObjectKeys<TObject>,
>(
  array: TArray,
  keyId: TKeys,
): {[key in TObject[TKeys]]: LookUp<TObject, TKeys, key>} {
  return Object.entries(array).reduce((acc, [, v]) => {
    const id = v[keyId as keyof typeof v];
    return {
      ...acc,
      [id]: v,
    };
  }, {}) as {[key in TObject[TKeys]]: LookUp<TObject, TKeys, key>};
}
