export const FFMPEG_RELEASE = 'b6.1.1';

// SHA-256 of the compressed GitHub release assets, fetched and hashed locally.
export const FFMPEG_ASSETS = {
  'darwin-arm64': {
    sha256: '8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa',
    bytes: 19246198,
  },
  'darwin-x64': {
    sha256: '929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106',
    bytes: 25296431,
  },
  'linux-arm': {
    sha256: '64b115a12f0ab77c277e3c418aae8b40ef881e75e746a0e2d066a206b9bc5172',
    bytes: 19167563,
  },
  'linux-arm64': {
    sha256: '754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0',
    bytes: 25568691,
  },
  'linux-ia32': {
    sha256: '169b27c078a8ecedb814cac67afccf15a9868d63e9d74ef86088adefaa500d00',
    bytes: 22184031,
  },
  'linux-x64': {
    sha256: 'bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa',
    bytes: 29354986,
  },
  'win32-x64': {
    sha256: '8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77',
    bytes: 29581307,
  },
} as const;

export function ffmpegAsset(
  platform = process.platform,
  arch = process.arch,
): {name: string; target: string; sha256: string; bytes: number} {
  const key = `${platform}-${arch}`;
  const asset = Object.entries(FFMPEG_ASSETS).find(([name]) => name === key);
  if (!asset) throw new Error(`No bundled ffmpeg download for ${key}`);
  return {name: `ffmpeg-${key}.gz`, target: key, ...asset[1]};
}
