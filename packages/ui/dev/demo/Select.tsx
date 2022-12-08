import {createSignal} from 'solid-js';
import {FlexField, HStack, Select, Text, VStack} from '../../src';
import {SelectOptions} from '../../src/lib/primitives/Select';

const items: SelectOptions<string>[] = [
  {
    label: 'XS',
    value: 'xs',
  },
  {
    label: 'SM',
    value: 'sm',
  },
  {
    label: 'MD',
    value: 'md',
  },
];

export function SelectDemo() {
  const [first, setFirst] = createSignal<string | string[]>(items[0].value);
  const [second, setSecond] = createSignal<string | string[]>(items[0].value);
  const [third, setThird] = createSignal<string | string[]>(items[0].value);
  return (
    <div>
      <Text size={'2xl'}>Segmented Control</Text>

      <HStack spacing={4}>
        <div style={{width: '400px'}}>
          <VStack spacing={2} marginTop={4}>
            <FlexField size={'lg'}>
              <Select
                items={items}
                value={first()}
                onSelectChange={setFirst}
              ></Select>
            </FlexField>
            <FlexField size={'md'}>
              <Select
                items={items}
                value={second()}
                onSelectChange={setSecond}
              ></Select>
            </FlexField>
            <FlexField size={'xs'}>
              <Select
                items={items}
                value={third()}
                onSelectChange={setThird}
              ></Select>
            </FlexField>
            <div>
              <Select
                items={items}
                value={third()}
                onSelectChange={setThird}
              ></Select>
            </div>
          </VStack>
        </div>
      </HStack>
    </div>
  );
}
