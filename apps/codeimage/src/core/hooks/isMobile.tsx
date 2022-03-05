type AppMode = 'full' | 'mobile';
import {useMediaQuery} from 'solid-use';

export function useModality(): AppMode {
  const phone = useMediaQuery(`screen and (max-width: 768px)`);
  return phone() ? 'mobile' : 'full';
}
