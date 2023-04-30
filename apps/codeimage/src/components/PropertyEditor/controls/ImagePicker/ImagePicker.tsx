import {getAssetsStore} from '@codeimage/store/assets/assets';
import {Box, VStack} from '@codeimage/ui';
import {ImagePickerInput} from './ImagePickerInput';
import {ImagePickerList} from './ImagePickerList';

interface ImagePickerProps {
  onChange: (assetId: string) => void;
  value: string | undefined;
}

export function ImagePicker(props: ImagePickerProps) {
  const assetsStore = getAssetsStore();
  const scope = 'frameBackground';

  const images = assetsStore.filterByScope(scope);

  return (
    <VStack spacing={2}>
      <Box width={'100%'}>
        <ImagePickerInput
          onUpload={asset => {
            props.onChange(asset.id);
          }}
          scope={scope}
        />
      </Box>
      <VStack marginTop={2} spacing={4}>
        <ImagePickerList
          onChange={asset => {
            props.onChange(asset);
          }}
          value={props.value}
          images={images()}
          onDelete={asset => {
            assetsStore.remove(asset);
            if (props.value === asset) {
              setTimeout(() => {
                const firstImage = images()[0];
                props.onChange(firstImage?.id ?? undefined);
              });
            }
          }}
        />
      </VStack>
    </VStack>
  );
}
