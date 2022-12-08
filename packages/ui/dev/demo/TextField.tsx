import {
  FieldLabel,
  FlexField,
  HStack,
  Text,
  TextField,
  VStack,
} from '../../src';

export function TextFieldDemo() {
  return (
    <div>
      <Text size={'2xl'}>TextField - Text</Text>

      <HStack spacing={4}>
        <div style={{width: '400px'}}>
          <VStack spacing={2} marginTop={4}>
            <FlexField size={'lg'}>
              <FieldLabel>Label</FieldLabel>
              <TextField type={'text'} value={'Text'}></TextField>
            </FlexField>
            <FlexField size={'md'}>
              <FieldLabel>Label</FieldLabel>
              <TextField type={'text'} value={'Text'}></TextField>
            </FlexField>
            <FlexField size={'xs'}>
              <FieldLabel>Label</FieldLabel>
              <TextField type={'text'} value={'Text'}></TextField>
            </FlexField>
          </VStack>
        </div>

        <div style={{width: '400px'}}>
          <VStack spacing={2} marginTop={4}>
            <FlexField size={'lg'}>
              <FieldLabel>Label</FieldLabel>
              <TextField inline type={'text'} value={'Text'}></TextField>
            </FlexField>
            <FlexField size={'md'}>
              <FieldLabel>Label</FieldLabel>
              <TextField inline type={'text'} value={'Text'}></TextField>
            </FlexField>
            <FlexField size={'xs'}>
              <FieldLabel>Label</FieldLabel>
              <TextField inline type={'text'} value={'Text'}></TextField>
            </FlexField>
          </VStack>
        </div>
      </HStack>
    </div>
  );
}
