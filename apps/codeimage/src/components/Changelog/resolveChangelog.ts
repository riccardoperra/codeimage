import {MDXProps} from 'mdx/types';
import {Component, createComponent, lazy} from 'solid-js';

interface ChangelogEntry {
  path: string;
  component: () => Promise<{default: Component}>;
}
export function resolveChangelog(props: ChangelogEntry) {
  const Component = (mdxProps: MDXProps) =>
    createComponent(lazy(props.component), mdxProps);

  const data = () => {
    const [version, date] = (props.path.split('/').at(-1) as string)
      .replace('.mdx', '')
      .split('_');
    return {version, date};
  };

  const version = () => data().version.replaceAll('-', '.');

  const date = () => {
    const [month, day, year] = data()
      .date.split('-')
      .map(str => parseInt(str, 10));
    return new Date(year, month, day);
  };

  return {
    Component,
    date,
    version,
  };
}
