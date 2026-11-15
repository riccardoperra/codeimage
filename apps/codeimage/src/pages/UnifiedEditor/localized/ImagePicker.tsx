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

  const images = assetsStore.filterByScope(['app', scope]);

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
      <Box marginTop={2}>
        <ImagePickerList
          onChange={asset => {
            props.onChange(asset);
          }}
          value={props.value}
          images={images()}
          onDelete={asset => {
            assetsStore.remove(asset);
            props.onChange(images()[0]?.id ?? undefined);
          }}
        />
      </Box>
    </VStack>
  );
}
