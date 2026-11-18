import {createSolid2Island} from '@core/solid2-islands/create-solid2-island';
import {mountProjectMenu} from 'virtual:codeimage-solid2-islands';

export const ProjectActionsMenuIsland = createSolid2Island(mountProjectMenu, {
  name: 'project-menu',
});
