import {assert, test} from 'vitest';
import {PresetMapper} from '../../../../src/modules/preset/mapper/index.js';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema.js';
import {PresetTestDataUtils} from '../data-utils.js';

test('fromEntityToDto', async () => {
  const mapper = new PresetMapper();
  const entity = PresetTestDataUtils.buildPreset('1', 'name', '1L', {});

  const expected = {
    id: entity.id,
    name: entity.name,
    version: Number(entity.version),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    data: {},
  } as PresetDto;

  const result = mapper.fromEntityToDto(entity);

  assert.deepStrictEqual(result, expected);
});
