import {describe, expect, it} from 'vitest';
import type {Environment, Requirement} from './requirements';
import {checkRequirements} from './requirements';

const status = (env: Environment) =>
  Object.fromEntries(
    checkRequirements(env).map(requirement => [
      requirement.id,
      requirement.status,
    ]),
  );

const find = <Id extends Requirement['id']>(env: Environment, id: Id) =>
  checkRequirements(env).find(
    (requirement): requirement is Extract<Requirement, {id: Id}> =>
      requirement.id === id,
  )!;

const capable: Environment = {
  chromium: 150,
  platform: 'macOS',
  platformVersion: '15.1.0',
  cores: 10,
  memory: 8,
};

describe('checkRequirements', () => {
  it('lists every requirement, in order, even when nothing is readable', () => {
    expect(checkRequirements({})).toEqual([
      {id: 'browser', status: 'unknown'},
      {id: 'os', status: 'unknown'},
      {id: 'cpu', status: 'unknown'},
      {id: 'memory', status: 'unknown', gb: undefined},
      {id: 'disk', status: 'unknown'},
      {id: 'setting', status: 'unknown'},
    ]);
  });

  it('meets what it can read on a capable Mac, and never claims disk, memory or the setting', () => {
    expect(status(capable)).toEqual({
      browser: 'met',
      os: 'met',
      cpu: 'met',
      memory: 'unknown',
      disk: 'unknown',
      setting: 'unknown',
    });
    expect(find(capable, 'os').system).toBe('macOS 15.1.0');
    expect(find(capable, 'cpu').cores).toBe(10);
  });

  it('needs Chrome 148 or later', () => {
    expect(find({chromium: 148}, 'browser').status).toBe('met');
    expect(find({chromium: 147}, 'browser')).toEqual({
      id: 'browser',
      status: 'unmet',
      version: 147,
    });
  });

  it('needs four cores', () => {
    expect(find({cores: 4}, 'cpu').status).toBe('met');
    expect(find({cores: 2}, 'cpu').status).toBe('unmet');
  });

  it('never rules on memory, since a GPU can stand in for the RAM', () => {
    expect(find({memory: 4}, 'memory')).toEqual({
      id: 'memory',
      status: 'unknown',
      gb: 4,
    });
    expect(find({memory: 8}, 'memory').status).toBe('unknown');
  });

  it.each([
    ['macOS', '13.0.0', 'met', 'macOS 13.0.0'],
    ['macOS', '12.7.1', 'unmet', 'macOS 12.7.1'],
    ['Windows', '15.0.0', 'met', 'Windows 11'],
    ['Windows', '10.0.0', 'met', 'Windows 10'],
    ['Windows', '0.3.0', 'unmet', 'Windows'],
    ['Linux', '6.8.0', 'met', 'Linux'],
    ['Chrome OS', '16093.0.0', 'unknown', 'Chrome OS'],
    ['Android', '15.0.0', 'unmet', 'Android'],
  ])('%s %s is %s', (platform, platformVersion, expected, system) => {
    expect(find({platform, platformVersion}, 'os')).toEqual({
      id: 'os',
      status: expected,
      system,
    });
  });
});
