import {Preset} from '@codeimage/prisma-models';

export class PresetTestDataUtils {
  static buildPreset(id: string, name: string, ownerId: string, data: {} = {}) {
    return {
      id,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: BigInt(1),
      data,
      ownerId,
    } as Preset;
  }
}
