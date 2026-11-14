import type {presetContract} from './modules/preset/preset.contract.js';
import type {projectContract} from './modules/project/project.contract.js';
import type {ApiTypesOf} from './shared/contract.js';

export type PresetApi = ApiTypesOf<typeof presetContract>;
export type ProjectApi = ApiTypesOf<typeof projectContract>;
export type {ErrorEnvelope} from './shared/contract.js';

export type CreateProjectApi = ProjectApi['create'];
export type DeleteProjectApi = ProjectApi['remove'];
export type UpdateProjectApi = ProjectApi['update'];
export type UpdateProjectNameApi = ProjectApi['updateName'];
export type GetProjectByIdApi = ProjectApi['get'];
export type CloneProjectApi = ProjectApi['clone'];
export type CreatePresetApi = PresetApi['create'];
export type DeletePresetApi = PresetApi['remove'];
export type GetPresetByIdApi = PresetApi['get'];
export type UpdatePresetApi = PresetApi['update'];
export type GetAllPresetApi = PresetApi['list'];

export type {TabMarks} from './modules/project/project.contract.js';
