# @codeimage/highlight

![Latest release Version](https://img.shields.io/badge/dynamic/json?style=for-the-badge&color=success&label=Version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Friccardoperra%2Fcodeimage%2Fmain%2Fpackages%2Fhighlight%2Fpackage.json)
[![Built with CodeMirror6](https://img.shields.io/badge/Built%20with-CodeMirror6-blue?style=for-the-badge)](https://codemirror.net/6/)

> Custom CodeMirror6 editor themes
> for [@codeimage/app](https://github.com/riccardoperra/codeimage/tree/main/apps/codeimage)

CodeImage editor themes are made by the internal `createTheme` api function.

Each theme must implement
the [CustomTheme](./src/lib/core/custom-theme.ts) interface that provides binding for
CodeMirror editor theme and the style for the theme switcher preview.

## How to create a new theme

To create a new theme, you need to run the `generate:theme` command.

```bash
$ pnpm generate:theme
```

It will ask you for a name of for the theme.

> **Warning** Theme name **must be in lower camel case**. \
> ex. githubDark is a valid theme name.

The script will do the following:

- Creates a new folder in the [`src/lib/themes`](./src/lib/themes) folder with the name you used.
- Generate a `index.ts` and `{{yourTheme}}.ts` file in the new folder.
- Automatically add the `export` and `typesVersion` entry in the [package.json](./package.json)

## Available themes

| Feature                                                |        Name        |
| :----------------------------------------------------- | :----------------: |
| ![Arc Dark](./assets/arc-dark.png)                     |      Arc Dark      |
| ![Aura Dark](./assets/aura-dark.png)                   |     Aura Dark      |
| ![Coldark Cold](./assets/coldark-cold.png)             |    Coldark Cold    |
| ![Coldark Dark](./assets/coldark-dark.png)             |    Coldark Dark    |
| ![Dracula](./assets/dracula.png)                       |      Dracula       |
| ![Duotone Dark](./assets/duotone-dark.png)             |    Duotone Dark    |
| ![Duotone Sea](./assets/duotone-sea.png)               |    Duotone Sea     |
| ![Holi dark](./assets/holi-dark.png)                   |     Holi dark      |
| ![One Light](./assets/light.png)                       |     One Light      |
| ![Material Light](./assets/material-light.png)         |   Material Light   |
| ![Material Ocean](./assets/material-ocean.png)         |   Material Ocean   |
| ![Material Palenight](./assets/material-palenight.png) | Material Palenight |
| ![Material Volcano](./assets/material-volcano.png)     |  Material Volcano  |
| ![Night owl](./assets/night-owl.png)                   |     Night Owl      |
| ![One Dark](./assets/one-dark.png)                     |      One Dark      |
| ![Synthwave84](./assets/synthwave84.png)               |    Synthwave 84    |
| ![VSCodeDark](./assets/vscode-dark.png)                |    VSCode Dark     |
