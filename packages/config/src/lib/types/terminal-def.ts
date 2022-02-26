export interface TerminalDefinition<T, TComponent> {
  name: T;
  component: TComponent;
}

export type TerminalDefinitionMap<T extends readonly string[], TComponent> = {
  keys: readonly [...T];
  entries: Record<T[number], TerminalDefinition<string, TComponent>>;
};
