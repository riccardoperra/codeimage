import type {AnimationFrame} from '@codeimage/render';

export function ffmpegArgs({
  width,
  height,
  fps,
  output,
}: {
  width: number;
  height: number;
  fps: number;
  output: string;
}) {
  const evenWidth = Math.ceil(width / 2) * 2;
  const evenHeight = Math.ceil(height / 2) * 2;
  const blocks = Math.ceil(evenWidth / 16) * Math.ceil(evenHeight / 16);
  const level = h264Level(blocks, fps);
  const bitrate = Math.min(
    20_000_000,
    Math.max(500_000, Math.round(evenWidth * evenHeight * fps * 0.075)),
  );
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-y',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s:v',
    `${evenWidth}x${evenHeight}`,
    '-r',
    String(fps),
    '-i',
    'pipe:0',
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-profile:v',
    'high',
    '-level:v',
    level,
    '-pix_fmt',
    'yuv420p',
    '-b:v',
    String(bitrate),
    '-g',
    String(fps * 2),
    '-keyint_min',
    String(fps * 2),
    '-sc_threshold',
    '0',
    '-vf',
    'scale=out_color_matrix=bt709:out_range=tv,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=limited',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-color_range',
    'tv',
    '-movflags',
    '+faststart',
    '-f',
    'mp4',
    output,
  ];
}

export function padFrame({width, height, rgba}: AnimationFrame) {
  if (rgba.byteLength !== width * height * 4)
    throw new Error('Invalid raw RGBA frame size');
  const evenWidth = Math.ceil(width / 2) * 2;
  const evenHeight = Math.ceil(height / 2) * 2;
  if (evenWidth === width && evenHeight === height) return rgba;
  const data = Buffer.allocUnsafe(evenWidth * evenHeight * 4);
  const stride = evenWidth * 4;
  for (let row = 0; row < height; row++) {
    data.set(
      rgba.subarray(row * width * 4, (row + 1) * width * 4),
      row * stride,
    );
    if (evenWidth > width)
      data.copy(
        data,
        row * stride + width * 4,
        row * stride + (width - 1) * 4,
        row * stride + width * 4,
      );
  }
  if (evenHeight > height)
    data.copy(data, height * stride, (height - 1) * stride, height * stride);
  return data;
}

function h264Level(blocks: number, fps: number) {
  if (blocks <= 8192 && blocks * fps <= 245760) return '4.0';
  if (blocks <= 8704 && blocks * fps <= 522240) return '4.2';
  if (blocks <= 22080 && blocks * fps <= 589824) return '5.0';
  if (blocks <= 36864 && blocks * fps <= 983040) return '5.1';
  return '5.2';
}
