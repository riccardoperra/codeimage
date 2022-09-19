![CodeImage logo](https://github.com/riccardoperra/codeimage/blob/main/banner.png?raw=true)

> Create elegant code screenshots of your source code.

![Latest release Version](https://img.shields.io/badge/dynamic/json?color=success&label=Version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Friccardoperra%2Fcodeimage%2Fmain%2Fpackage.json)
![Build workflow badge](https://img.shields.io/github/workflow/status/riccardoperra/codeimage/Build)
[![Issues](https://img.shields.io/github/issues/riccardoperra/codeimage)](https://github.com/riccardoperra/codeimage/issues)
![Lint workflow badge](https://img.shields.io/github/workflow/status/riccardoperra/codeimage/Lint?label=lint)
[![Built with SolidJS](https://img.shields.io/badge/Built%20with-SolidJS-blue)](https://github.com/solidjs/solid)
[![Built with Vanilla Extract](https://img.shields.io/badge/Built%20with-Vanilla%20Extract-ff69b4)](https://github.com/seek-oss/vanilla-extract)
[![Code quality](https://img.shields.io/lgtm/grade/javascript/github/riccardoperra/codeimage)](https://lgtm.com/projects/g/riccardoperra/codeimage/alerts/?mode=list)
![License](https://img.shields.io/github/license/riccardoperra/codeimage)
![CodeImage showcase](./showcase_1.png)

## Introduction

[CodeImage](https://codeimage.dev) is the newest tool to help developers to create beautiful screenshots of their code, providing several
features to speed up the process to post in social media.

## 💻 Run locally

**CodeImage** use a monorepo structure with pnpm. It's currently subdivided in these packages:
- [@codeimage/app](./apps/codeimage): contains the source code for the [codeimage.dev](https://codeimage.dev) website.
- [@codeimage/api](./apps/api): contains the source code for [codeimage.dev](https://codeimage.dev) backend.
- [@codeimage/config](./packages/config): contains the base configurations and interfaces for CodeImage front-end application
- [@codeimage/dom-export](./packages/dom-export): contains the [html-to-image](https://github.com/bubkoo/html-to-image) fork which includes several fix for image export
- [@codeimage/highlight](./packages/highlight): contains the editor and highlighting themes available on CodeImage application
- [@codeimage/locale](./packages/locale): contains a wrapper of @solid-primitives/i18n which includes strict typing for i18n
- [@codeimage/ui](./packages/ui): contains the source code of the UI kit of CodeImage front-end application
- [@codeimage/vanilla-extract](./packages/vanilla-extract): contain the [Vanilla Extract](https://github.com/seek-oss/vanilla-extract) plugin fork which includes SolidJS and PNPM fixes to work under monorepo.
- [@codeimage/prisma-models](./packages/prisma-models): contains the Prisma ORM backend models shared across front-end and back-end application.
- [@codeimage/atomic-state](./packages/atomic-state): contain the source code of a small state manager which includes some utilities helper for RxJS and solid-js/store

To run the project locally, you must have in your local machine pnpm >= 7 and node >= 16.x;

1. Install dependencies

```bash
$ pnpm install
```

2. Build core libraries

```bash
$ pnpm libs:build
```

3. Run @codeimage/app

```bash
$ pnpm dev
```

## 🤖 Tech stack

CodeImage front-end app is entirely built with [SolidJS](https://github.com/solidjs/solid), and currently relies on these technologies:

- [CodeMirror6](https://codemirror.net/6/): Code Editor
- [vanilla-extract](https://github.com/seek-oss/vanilla-extract): Design system and app theme
- [HeroIcons](https://heroicons.com/): App icons
- [solid-aria](https://github.com/solidjs-community/solid-aria): High-quality primitives that help to build accessible user interfaces
- [@ngneat/elf](https://github.com/ngneat/elf) + [RxJS](https://github.com/ReactiveX/rxjs): Reactive state management

#### Other libraries:

- [solid-primitives](https://github.com/solidjs-community/solid-primitives): SolidJS primitives library
- [solid-use](https://github.com/LXSMNSYC/solid-use): Collection of solid-js utilities
- [material-icon-theme](https://github.com/PKief/vscode-material-icon-theme): Icons for custom terminal tabs
- [floating-ui](https://github.com/floating-ui/floating-ui/): Utilities for positioning floating elements
- [Lion](https://github.com/ing-bank/lion): White label web components in Lit (used for custom combobox)

## 🌏 Contributions

> :warning: **Read this before opening any PR!**

When contributing, it's better to first discuss the change you wish to make via issue or discussion, or any other method
with the owners of this repository before making a change.

See the [CONTRIBUTING.md](/CONTRIBUTING.md) guide for more details.


---


<p align="left">
  <img src="https://user-images.githubusercontent.com/37072694/168666273-22af1fed-6ee5-49a5-be2a-6e0b9da998cf.png" width="600">
</p>
<p align="left">
  CodeImage is the winner of <a href="https://hack.solidjs.com">SolidHack 2022</a> for the Best Application category!
</p>


## License

MIT © [Riccardo Perra](https://github.com/riccardoperra)
