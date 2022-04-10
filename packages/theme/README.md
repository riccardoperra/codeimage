# @codeimage/theme

![Latest release Version](https://img.shields.io/badge/dynamic/json?style=for-the-badge&color=success&label=Version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Friccardoperra%2Fcodeimage%2Fmain%2Fpackages%2Ftheme%2Fpackage.json)
[![Built with SolidJS](https://img.shields.io/badge/Built%20with-SolidJS-blue?style=for-the-badge)](https://github.com/solidjs/solid)
[![Built with CodeMirror6](https://img.shields.io/badge/Built%20with-CodeMirror6-blue?style=for-the-badge)](https://codemirror.net/6/)

> Custom editor themes for [@codeimage/app](https://github.com/riccardoperra/codeimage/tree/main/apps/codeimage)

CodeImage editor themes are made by the internal `createThemeFactory` api function.

Each theme must implement the [CustomTheme](./src/lib/core/custom-theme.ts) interface that provides binding for
CodeMirror editor theme and the style for the theme switcher preview.

There are two ways of creating themes:

- `createTheme`: themes based on the new @codemirror/highlight api.
- `createPrismJSTheme`: themes that uses the PrismJS token binding class for highlighting.

## Available themes

| Feature                                                |        Name        |
|:-------------------------------------------------------|:------------------:|
| ![Arc Dark](./assets/arc-dark.png)                     |      Arc Dark      |
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
| ![VSCodeDark](./assets/vscode-dark.png)                |  VSCode Dark       |

