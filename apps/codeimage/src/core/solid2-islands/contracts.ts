export type Solid2Mount<Props extends object> = (
  target: HTMLElement,
  snapshot: Props,
) => {
  update(snapshot: Props): void;
  dispose(): void;
};
