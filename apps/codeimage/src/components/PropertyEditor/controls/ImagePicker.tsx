import {getAssetsStore, PersistedAsset} from '@codeimage/store/assets/assets';
import {Box, Text, themeVars, VStack} from '@codeimage/ui';
import {Button, Link, TextField} from '@codeui/kit';
import {createSignal} from 'solid-js';
import * as styles from './CustomColorPicker.css';
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
      <Box marginTop={2}>
        <ImagePickerList
          onChange={asset => {
            props.onChange(asset);
          }}
          value={props.value}
          images={images()}
          onDelete={asset => {
            assetsStore.remove(asset);
            if (props.value === asset) {
              requestAnimationFrame(() => {
                const firstImage = images()[0];
                props.onChange(firstImage?.id ?? undefined);
              });
            }
          }}
        />
      </Box>
    </VStack>
  );
}

interface ImagePickerInputProps {
  scope: string;
  onUpload: (asset: PersistedAsset) => void;
}

export function ImagePickerInput(props: ImagePickerInputProps) {
  let imageInputRef!: HTMLInputElement;
  const [value, setValue] = createSignal('');
  const assetsStore = getAssetsStore();

  return (
    <div>
      <Box
        display={'flex'}
        alignItems={'center'}
        justifyContent={'spaceBetween'}
      >
        <TextField
          slotClasses={{
            root: styles.textFieldImageUrl,
            input: styles.textFieldImageInput,
          }}
          size={'sm'}
          value={value()}
          onChange={setValue}
          placeholder={'Enter a valid image URL'}
        />
        <Button
          disabled={!value() || !value().startsWith('http')}
          class={styles.confirmButton}
          size={'sm'}
          aria-label={'Confirm'}
          theme={'primary'}
          onClick={() =>
            assetsStore.addLink(value(), props.scope).then(props.onUpload)
          }
        >
          Upload
        </Button>
      </Box>
      <Box marginTop={2}>
        <Text size={'sm'}>
          <span
            style={{
              color: themeVars.dynamicColors.descriptionTextColor,
            }}
          >
            Enter a image url, or{' '}
            <Link
              style={{'text-decoration': 'underline'}}
              onClick={() => {
                imageInputRef.click();
              }}
              variant={'underline'}
            >
              browse from your files
            </Link>
            <input
              type={'file'}
              accept={'image/x-png,image/gif,image/jpeg'}
              style={{display: 'none'}}
              onChange={event => {
                const image = event.currentTarget.files?.[0];
                if (image) {
                  return assetsStore
                    .addFile(image, props.scope)
                    .then(props.onUpload);
                }
              }}
              ref={imageInputRef}
            />
          </span>
        </Text>
      </Box>
    </div>
  );
}
