import type {presetContract} from './modules/preset/preset.contract.js';
import type {projectContract} from './modules/project/project.contract.js';
import type {signatureContract} from './modules/signature/signature.contract.js';
import type {ApiTypesOf} from './shared/contract.js';

export type PresetApi = ApiTypesOf<typeof presetContract>;
export type ProjectApi = ApiTypesOf<typeof projectContract>;
export type SignatureApi = ApiTypesOf<typeof signatureContract>;
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
export type CreateSignatureApi = SignatureApi['create'];
export type DeleteSignatureApi = SignatureApi['remove'];
export type GetSignatureByIdApi = SignatureApi['get'];
export type UpdateSignatureApi = SignatureApi['update'];
export type GetAllSignatureApi = SignatureApi['list'];

export type {
  AnimationSettings,
  TabMarks,
} from './modules/project/project.contract.js';
