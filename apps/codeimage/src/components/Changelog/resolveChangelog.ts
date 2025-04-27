import type {MDXProps} from 'mdx/types';
import {type Component, createComponent, lazy} from 'solid-js';

interface ChangelogEntry {
  path: string;
  component: () => Promise<{default: Component}>;
}

export function parseChangelogFilePath(path: string) {
  const [version, date] = (path.split('/').at(-1) as string)
    .replace('.mdx', '')
    .split('_');
  return {version: version.replaceAll('-', '.'), date};
}
export function resolveChangelog(props: ChangelogEntry) {
  const Component = (mdxProps: MDXProps) =>
    createComponent(lazy(props.component), mdxProps);

  const data = () => parseChangelogFilePath(props.path);

  const version = () => data().version;

  const date = () => {
    const [month, day, year] = data()
      .date.split('-')
      .map(str => parseInt(str, 10));
    return new Date(year, month - 1, day);
  };

  return {
    Component,
    date,
    version,
  };
}
