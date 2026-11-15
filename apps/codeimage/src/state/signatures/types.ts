import type {GetSignatureByIdApi} from '@codeimage/api/api-types';
import type {FrameSignature} from '../frame/model';

export type ApiSignature = GetSignatureByIdApi['response'];

/** What a saved signature holds: a snippet signature without its link back. */
export type SignatureData = Omit<FrameSignature, 'savedId'>;

export type SavedSignature = Omit<ApiSignature, 'data'> & {
  data: SignatureData;
};

export type SavedSignaturesArray = Array<SavedSignature>;
