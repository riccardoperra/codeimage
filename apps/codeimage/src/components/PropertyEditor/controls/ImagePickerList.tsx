import {PersistedAsset} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {Box, HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createSignal, For, Show, Suspense} from 'solid-js';
import * as styles from './CustomColorPicker.css';

interface ImagePickerListProps {
  value?: string;
  images: PersistedAsset[];
  onChange: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

interface ImagePickerAssetImageProps {
  assetId: string;
}

function ImagePickerAssetImage(props: ImagePickerAssetImageProps) {
  return (
    <Suspense fallback={<SkeletonLine width={'100%'} height={'100%'} />}>
      <div style={{height: '90px'}}>
        <AssetsImage assetId={props.assetId} />
      </div>
    </Suspense>
  );
}

export function ImagePickerList(props: ImagePickerListProps) {
  return (
    <Box marginTop={4}>
      <div class={styles.imageGrid}>
        <Suspense>
          <For each={props.images.map(image => image.id)}>
            {image => (
              <Box display={'flex'} alignItems={'flexStart'}>
                <div
                  class={styles.imagesCard}
                  data-active={props.value === image || undefined}
                  onClick={() => props.onChange(image)}
                >
                  <ImagePickerAssetImage assetId={image} />
                  <Box marginTop={3} display={'flex'} justifyContent={'center'}>
                    <ImagePickerDeleteButton
                      onDelete={() => props.onDelete(image)}
                    />
                  </Box>
                </div>
              </Box>
            )}
          </For>
        </Suspense>
      </div>
    </Box>
  );
}

interface ImagePickerDeleteButtonProps {
  onDelete: () => void;
}

function ImagePickerDeleteButton(props: ImagePickerDeleteButtonProps) {
  const [deleting, setDeleting] = createSignal(false);
  return (
    <Show
      fallback={
        <Button
          block
          size={'xs'}
          aria-label={'Delete'}
          theme={'secondary'}
          onClick={() => setDeleting(true)}
        >
          Delete
        </Button>
      }
      when={deleting()}
    >
      <HStack spacing={2} width={'100%'}>
        <Button
          block
          size={'xs'}
          aria-label={'Delete'}
          theme={'secondary'}
          onClick={() => setDeleting(false)}
        >
          Undo
        </Button>
        <Button
          block
          size={'xs'}
          aria-label={'Delete'}
          theme={'negative'}
          onClick={e => {
            props.onDelete();
          }}
        >
          Delete
        </Button>
      </HStack>
    </Show>
  );
}
