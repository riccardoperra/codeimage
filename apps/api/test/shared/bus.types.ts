import {createBus, defineCommand, defineHandler} from '../../src/shared/bus.js';
import type {ProjectRepository} from '../../src/modules/project/project.repository.js';

export function checkBusTypes(projects: ProjectRepository) {
  const bus = createBus();
  const command = defineCommand<{name: string}, number>('typed');
  // @ts-expect-error The handler must return the command's declared result.
  bus.register(command, async () => 'wrong');
  // @ts-expect-error Handler factories must return the command's declared result.
  defineHandler(command, (_: {prefix: string}) => async () => 'wrong');
  // @ts-expect-error A command's payload is checked at its call site.
  command({name: 1});
  // @ts-expect-error Writes require an owner scope.
  projects.update('id', {});
  return bus.execute(command({name: 'Ada'})) satisfies Promise<number>;
}
