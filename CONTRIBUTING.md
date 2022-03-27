# Contributing

> Thank you for considering contributing to this project. Your help is very much appreciated!

When contributing, it's better to first discuss the change you wish to make via issue or discussion, or any other method
with the owners of this repository before making a change.

All members of our community are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please make sure you are
welcoming and friendly in all of our spaces.

## Cloning the repository
To start contributing to the project, you have to fork this repository and clone it to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/codeimage.git
```

## Installing Node.js and pnpm

This repository uses [pnpm](https://pnpm.io/it/) to manage multiple projects. You need to install **pnpm 6.23.2 or higher** and **Node.js v14 or higher**.

You can run the following commands in your terminal to check your local Node.js and npm versions:

```bash
node -v
pnpm -v
```

## Installing dependencies

Once in the project's root directory, you can run the following command to install the project's dependencies:

```bash
pnpm install
```

## Creating a new branch

Make sure you create a new branch for your changes. You can do this by running the following command in your terminal:

```bash
git checkout -b feat/my-component
```

## Starting the development server

After installing the project's dependencies, you can run the following command to start the development server:

```bash
pnpm libs:build #Install dependent libraries
pnpm app:dev
```

Now you can open http://localhost:4200 in your browser to see the project's site.

## Pull Request Process

1. We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/) in our commit messages, i.e.
   `feat(core): improve typing`
2. Make sure you cover all code changes with unit tests
3. When you are ready, create Pull Request of your fork into original repository
