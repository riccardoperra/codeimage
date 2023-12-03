type AppMode = 'full' | 'mobile';

export function useModality(): AppMode {
  // const phone = useMediaQuery(`screen and (max-width: 768px)`);
  const phone = window.matchMedia('screen and (max-width: 768px)').matches;
  return phone ? 'mobile' : 'full';
}
