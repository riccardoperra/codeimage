import {test} from 'tap';
import {PresetMapper} from '../../../../src/modules/preset/mapper';
import {PresetDto} from '../../../../src/modules/preset/schema/preset-dto.schema';
import {PresetTestDataUtils} from '../data-utils';

test('fromEntityToDto', async t => {
  const mapper = new PresetMapper();
  const entity = PresetTestDataUtils.buildPreset('1', 'name', '1L', {});

  const expected = {
    id: entity.id,
    updatedAt: entity.updatedAt,
    createdAt: entity.createdAt,
    version: Number(entity.version),
    name: entity.name,
  } as PresetDto;

  const result = mapper.fromEntityToDto(entity);

  t.strictSame(result, expected);
});
