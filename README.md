![CodeImage logo](https://github.com/riccardoperra/codeimage/blob/main/codeimage-logo-black.png#gh-light-mode-only)
![CodeImage logo](https://github.com/riccardoperra/codeimage/blob/main/codeimage-logo-white.png#gh-dark-mode-only)

> Create elegant code screenshots of your source code.

![Latest release Version](https://img.shields.io/badge/dynamic/json?color=success&label=Version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Friccardoperra%2Fcodeimage%2Fmain%2Fapps%2Fcodeimage%2Fpackage.json)
![Build workflow badge](https://img.shields.io/github/workflow/status/riccardoperra/codeimage/Build)
![Issues](https://img.shields.io/github/issues/riccardoperra/codeimage)
![Lint workflow badge](https://img.shields.io/github/workflow/status/riccardoperra/codeimage/Lint?label=lint)
![Built with SolidJS](https://img.shields.io/badge/Built%20with-SolidJS-blue)
![Built with Vanilla Extract](https://img.shields.io/badge/Built%20with-Vanilla%20Extract-ff69b4)
![Code quality](https://img.shields.io/lgtm/grade/javascript/github/riccardoperra/codeimage)
![License](https://img.shields.io/github/license/riccardoperra/codeimage)

![CodeImage showcase](https://i.imgur.com/9mrRo7n.gif)

## Introduction

CodeImage is the newest tool to help developers to create beautiful screenshots of their code, providing several
features to speed up the process to post in social media.

## Getting started

To run the project locally, you must have in your local machine pnpm >= 6.23.2 and node >= 14.x;

1. Install dependencies

```bash
$ pnpm install
```

2. Build core libraries

```bash
$ pnpm libs:build
```

3. Run @codeimage/app

- Development mode:
```bash
$ pnpm app:dev
```

- Production mode (no reload, serve static files):
```bash
$ pnpm build:prod && pnpm serve --filter=@codeimage/app
```

## Features

✅ Customizable terminal window, editor and frame style \
✅ 15+ custom editor themes \
✅ Supports 10+ languages \
✅ Dynamic icons based by tab name extension \
✅ Uses browser [Web share api](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) to share your snippets \
✅ Mobile supports \
✅ Light/Dark mode support \
✅ Open-source

// WIP

## Usage

// WIP

## Tech stack

CodeImage front-end app currently relies on these technologies:

- [SolidJS](https://github.com/solidjs/solid): UI framework
- [CodeMirror6](https://codemirror.net/6/): Code Editor
- [vanilla-extract](https://github.com/seek-oss/vanilla-extract): Design system
- [solid-headless](https://github.com/LXSMNSYC/solid-headless): SolidJS headless component library
- [@ngneat/elf](https://github.com/ngneat/elf) + [RxJS](https://github.com/ReactiveX/rxjs): Reactive state management

#### Other libraries:

- [material-icon-theme](https://github.com/PKief/vscode-material-icon-theme): Used for custom terminal tabs icons
- [solid-primitives](https://github.com/solidjs-community/solid-primitives): SolidJS primitives library
- [@emotion/css](https://github.com/emotion-js/emotion/tree/main/packages/css): CSS Utility - Used for custom codemirror themes
- [floating-ui](https://github.com/floating-ui/floating-ui/): Utilities for positioning floating elements
- [Lion](https://github.com/ing-bank/lion): White label web components (used for custom combobox)
- [solid-use](https://github.com/LXSMNSYC/solid-use): Collection of solid-js utilities

## Contributions

> :warning: **Read this before opening any PR!**

When contributing, it's better to first discuss the change you wish to make via issue or discussion, or any other method with the owners of this repository before making a change.

Until the end of [solid hackathon](https://hack.solidjs.com/) voting ends phase, pull request must target the [next](https://github.com/riccardoperra/codeimage/tree/next) branch

See the [CONTRIBUTING.md](/CONTRIBUTING.md) guide for more details.

## License

MIT © [Riccardo Perra](https://github.com/riccardoperra)
