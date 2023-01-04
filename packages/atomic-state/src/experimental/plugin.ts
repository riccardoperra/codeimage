type Plugin<Name, T> = T & {
  name: Name;
};

export function makePlugin<TStore, TName extends string, PluginResult>(
  name: TName,
  pluginCreator: (store: TStore) => PluginResult,
): (ctx: TStore) => Plugin<TName, PluginResult> {
  return ctx => {
    return Object.assign(
      {
        name,
      },
      pluginCreator(ctx),
    );
  };
}
