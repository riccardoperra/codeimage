export const FFMPEG_HELP =
  'Provide ffmpeg with libx264 using --ffmpeg <path>, CODEIMAGE_FFMPEG, or ffmpeg on PATH.';

export function installInstructions(platform: NodeJS.Platform) {
  if (platform === 'darwin')
    return `Install Homebrew from https://brew.sh, then run: brew install ffmpeg. ${FFMPEG_HELP}`;
  if (platform === 'win32')
    return `Install winget from https://learn.microsoft.com/windows/package-manager/winget/, then run: winget install --id Gyan.FFmpeg -e --source winget. ${FFMPEG_HELP}`;
  if (platform === 'linux')
    return `Install ffmpeg with your distro package manager: sudo apt install ffmpeg; sudo dnf install ffmpeg; or sudo pacman -S ffmpeg. ${FFMPEG_HELP}`;
  return `Install ffmpeg with your platform's package manager. ${FFMPEG_HELP}`;
}
