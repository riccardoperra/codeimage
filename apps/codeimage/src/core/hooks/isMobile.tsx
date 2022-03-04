type AppMode = 'full' | 'mobile';

export function useModality(): AppMode {
  const mobile = window.innerWidth <= 649;
  return mobile ? 'mobile' : 'full';
}
