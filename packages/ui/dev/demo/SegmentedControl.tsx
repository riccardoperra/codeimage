import {createSignal} from 'solid-js';
import {
  FlexField,
  HStack,
  SegmentedField,
  SegmentedFieldItem,
  Text,
  VStack,
} from '../../src';

const items: SegmentedFieldItem<string>[] = [
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

export function SegmentedFieldDemo() {
  const [first, setFirst] = createSignal(items[0].value);
  const [second, setSecond] = createSignal(items[0].value);
  const [third, setThird] = createSignal(items[0].value);
  return (
    <div>
      <Text size={'2xl'}>Segmented Control</Text>

      <HStack spacing={4}>
        <div style={{width: '400px'}}>
          <VStack spacing={2} marginTop={4}>
            <FlexField size={'lg'}>
              <SegmentedField
                items={items}
                value={first()}
                onChange={setFirst}
              ></SegmentedField>
            </FlexField>
            <FlexField size={'md'}>
              <SegmentedField
                items={items}
                value={second()}
                onChange={setSecond}
              ></SegmentedField>
            </FlexField>
            <FlexField size={'xs'}>
              <SegmentedField
                items={items}
                value={third()}
                onChange={setThird}
              ></SegmentedField>
            </FlexField>
          </VStack>
        </div>
      </HStack>
    </div>
  );
}
