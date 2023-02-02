![CodeImage logo](assets/banner.png?raw=true)

> Create elegant code screenshots of your source code.

![Latest release Version](https://img.shields.io/badge/dynamic/json?color=success&label=Version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Friccardoperra%2Fcodeimage%2Fmain%2Fpackage.json)
![Build workflow badge](https://img.shields.io/github/actions/workflow/status/riccardoperra/codeimage/prod-deploy.yml?branch=main)
[![Issues](https://img.shields.io/github/issues/riccardoperra/codeimage)](https://github.com/riccardoperra/codeimage/issues)
[![Built with SolidJS](https://img.shields.io/badge/Built%20with-SolidJS-blue)](https://github.com/solidjs/solid)
[![Built with Vanilla Extract](https://img.shields.io/badge/Built%20with-Vanilla%20Extract-ff69b4)](https://github.com/seek-oss/vanilla-extract)
![License](https://img.shields.io/github/license/riccardoperra/codeimage)

## Introduction

[CodeImage](https://codeimage.dev) is the newest tool to help developers to create beautiful screenshots of their code,
providing several
features to speed up the process to post in social media.

<a href="https://www.producthunt.com/posts/codeimage?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-codeimage" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=371306&theme=light" alt="CodeImage - A&#0032;tool&#0032;to&#0032;manage&#0032;and&#0032;beautify&#0032;your&#0032;code&#0032;screenshots | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

![CodeImage showcase](assets/showcase_1.png)


## 🤖 Tech stack

CodeImage architecture consist of a PNPM monorepo, currently subdivided in `packages` and `apps`.

### Apps

#### [@codeimage/app](./apps/codeimage)

The front-end application, entirely built with SolidJS.

It currently also relies on these libraries:

- [vanilla-extract](https://github.com/seek-oss/vanilla-extract): Zero-runtime Stylesheets-in-TypeScript.
- [CodeMirror6](https://codemirror.net/6/): Extensible code editor
- [solid-aria](https://github.com/solidjs-community/solid-aria): High-quality primitives that help to build accessible
  user interfaces
- [solid-primitives](https://github.com/solidjs-community/solid-primitives): SolidJS primitives library

#### [@codeimage/api](./apps/api)

The REST API layer built with [Fastify](https://github.com/fastify/fastify),
[Prisma ORM](https://github.com/prisma/prisma) and [Auth0](https://auth0.com/).

### Packages

- [@codeimage/ui](./packages/ui): contains the source code of the UI kit of CodeImage front-end application
- [@codeimage/config](./packages/config): contains the base configurations and interfaces for CodeImage
- [@codeimage/highlight](./packages/highlight): contains the custom editor and highlighting themes for CodeMirror


- [@codeimage/dom-export](./packages/dom-export): contains the [html-to-image](https://github.com/bubkoo/html-to-image)
  fork which includes several fix for image export
- [@codeimage/locale](./packages/locale): contains a wrapper
  of [@solid-primitives/i18n](https://github.com/solidjs-community/solid-primitives/tree/main/packages/i18n) which
  includes strict typing for i18n
- [@codeimage/vanilla-extract](./packages/vanilla-extract): contain
  the [Vanilla Extract](https://github.com/seek-oss/vanilla-extract) plugin fork which includes SolidJS and PNPM fixes
  to work under monorepo.
- [@codeimage/prisma-models](./packages/prisma-models): contains the Prisma ORM backend models shared across front-end
  and back-end application.
- [@codeimage/atomic-state](./packages/atomic-state): contain the source code of a small state manager which includes
  some utilities helper for RxJS and solid-js/store

## 🌏 Contributions

> **Warning** **Read this before opening any PR!**

When contributing, it's better to first discuss the change you wish to make via issue or discussion, or any other method
with the owners of this repository before making a change.

See the [CONTRIBUTING.md](./CONTRIBUTING.md) guide for more details.


---


<p align="left">
  <img src="https://user-images.githubusercontent.com/37072694/168666273-22af1fed-6ee5-49a5-be2a-6e0b9da998cf.png" width="600">
</p>
<p align="left">
  CodeImage is the winner of <a href="https://hack.solidjs.com">SolidHack 2022</a> for the Best Application category!
</p>

## License

MIT © [Riccardo Perra](https://github.com/riccardoperra)
