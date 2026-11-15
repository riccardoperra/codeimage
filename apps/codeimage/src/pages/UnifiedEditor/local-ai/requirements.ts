/** What the page can read about this device. Each field is missing when the browser hides it. */
export interface Environment {
  /** Major version of the Chromium brand. */
  readonly chromium?: number;
  /** `userAgentData` platform: 'macOS', 'Windows', 'Linux', 'Chrome OS', 'Android'… */
  readonly platform?: string;
  readonly platformVersion?: string;
  readonly cores?: number;
  /** `navigator.deviceMemory`, which Chrome caps at 8. */
  readonly memory?: number;
}

export type RequirementStatus = 'met' | 'unmet' | 'unknown';

/** One of Chrome's requirements for its on-device model, and what this device shows. */
export type Requirement =
  | {
      readonly id: 'browser';
      readonly status: RequirementStatus;
      readonly version?: number;
    }
  | {
      readonly id: 'os';
      readonly status: RequirementStatus;
      readonly system?: string;
    }
  | {
      readonly id: 'cpu';
      readonly status: RequirementStatus;
      readonly cores?: number;
    }
  /** Never met or unmet: a GPU with more than 4 GB of VRAM also qualifies, and no page can read VRAM. */
  | {readonly id: 'memory'; readonly status: 'unknown'; readonly gb?: number}
  | {readonly id: 'disk'; readonly status: 'unknown'}
  | {readonly id: 'setting'; readonly status: 'unknown'};

export const MIN_CHROME = 148;
const MIN_MACOS = 13;
const MIN_CORES = 4;
// deviceMemory stops at 8, so only a lower value proves less than 16 GB.
export const MEMORY_CAP = 8;

const major = (version: string | undefined) => {
  const value = Number.parseInt(version ?? '', 10);
  return Number.isNaN(value) ? undefined : value;
};

function checkOs(env: Environment): Requirement {
  const {platform, platformVersion} = env;
  if (!platform) return {id: 'os', status: 'unknown'};
  const version = major(platformVersion);
  switch (platform) {
    case 'macOS':
      return {
        id: 'os',
        status:
          version === undefined
            ? 'unknown'
            : version >= MIN_MACOS
              ? 'met'
              : 'unmet',
        system: platformVersion ? `macOS ${platformVersion}` : 'macOS',
      };
    case 'Windows':
      // platformVersion is 13+ on Windows 11, 1 to 10 on Windows 10, and 0 before it.
      if (version === undefined) {
        return {id: 'os', status: 'unknown', system: 'Windows'};
      }
      return {
        id: 'os',
        status: version >= 1 ? 'met' : 'unmet',
        system:
          version >= 13
            ? 'Windows 11'
            : version >= 1
              ? 'Windows 10'
              : 'Windows',
      };
    case 'Linux':
      return {id: 'os', status: 'met', system: 'Linux'};
    case 'Android':
    case 'iOS':
      return {id: 'os', status: 'unmet', system: platform};
    default:
      // ChromeOS qualifies only on a Chromebook Plus, which the page cannot tell.
      return {id: 'os', status: 'unknown', system: platform};
  }
}

/** Chrome's requirements, each checked where the page can read it. */
export function checkRequirements(env: Environment): readonly Requirement[] {
  const {chromium, cores, memory} = env;
  return [
    chromium === undefined
      ? {id: 'browser', status: 'unknown'}
      : {
          id: 'browser',
          status: chromium >= MIN_CHROME ? 'met' : 'unmet',
          version: chromium,
        },
    checkOs(env),
    cores === undefined
      ? {id: 'cpu', status: 'unknown'}
      : {id: 'cpu', status: cores >= MIN_CORES ? 'met' : 'unmet', cores},
    {id: 'memory', status: 'unknown', gb: memory},
    {id: 'disk', status: 'unknown'},
    {id: 'setting', status: 'unknown'},
  ];
}

interface UserAgentData {
  getHighEntropyValues(hints: string[]): Promise<{
    platform?: string;
    platformVersion?: string;
    fullVersionList?: {brand: string; version: string}[];
  }>;
}

/** Reads the environment from `navigator`, leaving out what this browser does not expose. */
export async function readEnvironment(): Promise<Environment> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: UserAgentData;
  };
  let values: Awaited<ReturnType<UserAgentData['getHighEntropyValues']>> = {};
  try {
    values =
      (await nav.userAgentData?.getHighEntropyValues([
        'platform',
        'platformVersion',
        'fullVersionList',
      ])) ?? {};
  } catch {
    // The hints are optional: the rows they feed say they could not check.
  }
  const chromium = values.fullVersionList?.find(
    entry => entry.brand === 'Chromium',
  );
  return {
    chromium: major(chromium?.version),
    platform: values.platform || undefined,
    platformVersion: values.platformVersion || undefined,
    cores: nav.hardwareConcurrency || undefined,
    memory: nav.deviceMemory || undefined,
  };
}
