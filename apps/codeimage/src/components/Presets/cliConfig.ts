type PresetSections = {
  frame: object;
  terminal: object;
  editor: object;
};

export function toCliConfig({frame, terminal, editor}: PresetSections) {
  return JSON.stringify({frame, terminal, editor}, null, 2);
}
