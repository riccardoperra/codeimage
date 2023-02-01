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
                multiple={false}
                items={items}
                value={first()}
                onSelectChange={setFirst}
              />
            </FlexField>
            <FlexField size={'md'}>
              <Select
                multiple={false}
                items={items}
                value={second()}
                onSelectChange={setSecond}
              />
            </FlexField>
            <FlexField size={'xs'}>
              <Select
                multiple={false}
                items={items}
                value={third()}
                onSelectChange={setThird}
              />
            </FlexField>
            <div>
              <Select
                multiple={false}
                items={items}
                value={third()}
                onSelectChange={setThird}
              />
            </div>
          </VStack>
        </div>
      </HStack>
    </div>
  );
}
