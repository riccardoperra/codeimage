import {AppStaticConfiguration} from '../types/configuration';
import {useContext} from 'solid-js';
import {StaticConfigurationContext} from './ConfigurationProvider';

export function createConfiguration<T extends AppStaticConfiguration>(
  configuration: T,
): [T, () => T] {
  if (!configuration.version) {
    throw new Error('No version specified');
  }

  const useConfiguration = () => {
    const context = useContext(StaticConfigurationContext);

    if (!context) {
      throw new Error('Static configuration missing');
    }

    return context as T;
  };

  return [configuration, useConfiguration];
}
