import assert from 'node:assert/strict';
import test from 'node:test';
import {compileBridge} from '../dist/transform.js';

const rules = new Map([
  ['legacy-kit', {standalone: ['Button'], compound: ['Menu']}],
  ['legacy-menu', {compound: ['Root']}],
]);

function compile(source, key = 0) {
  return compileBridge(source, {
    key,
    file: '/app/src/Panel.tsx',
    modules: rules,
    legacyComponents: ['./Icon'],
  });
}

test('rewrites a standalone import and keeps reactive props in the host', () => {
  const {host, legacy, exported} = compile(`
    import {Button as Save} from 'legacy-kit';
    export const Panel = ({title, locked, save}) =>
      <Save disabled={locked} onClick={save}>{title}</Save>;
  `);

  assert.deepEqual(exported, ['mount0Component0']);
  assert.match(host, /from 'virtual:solid1-bridge'/);
  assert.match(host, /const Save = createSolid1Bridge\(mount0Component0\);/);
  assert.match(
    host,
    /<Save disabled=\{locked\} onClick=\{save\}>\{title\}<\/Save>/,
  );
  assert.doesNotMatch(host, /from 'legacy-kit'/);
  assert.match(legacy, /createLegacyMount\(Save\)/);
});

test('moves a compound subtree as a unit and captures its callbacks and text', () => {
  const {host, legacy, exported} = compile(
    `
    import {Root as Menu, Trigger, Content, Item} from 'legacy-menu';
    import {Icon} from './Icon';
    export const Panel = props => (
      <Menu><Trigger as={Icon} /><Content>
        <Item onSelect={props.run}>{props.label}</Item>
      </Content></Menu>
    );
  `,
    1,
  );

  assert.deepEqual(exported, ['mount1Family0']);
  assert.match(legacy, /from "\/app\/src\/Icon"/);
  assert.match(legacy, /<Menu><Trigger as=\{Icon\} \/><Content>/);
  assert.match(
    legacy,
    /<Item onSelect=\{props.values\[0\]\}>\{props.values\[1\]\}<\/Item>/,
  );
  assert.match(host, /readIslandValue\(props.run, "callback"\)/);
  assert.match(host, /readIslandValue\(props.label, "text"\)/);
  assert.doesNotMatch(host, /from 'legacy-menu'/);
});

test('rejects a host component passed as a legacy trigger', () => {
  assert.throws(
    () =>
      compile(`
      import {Menu, Trigger} from 'legacy-kit';
      const HostButton = () => <button />;
      export const Panel = () => <Menu><Trigger as={HostButton} /></Menu>;
    `),
    /cannot move component HostButton/,
  );
});
