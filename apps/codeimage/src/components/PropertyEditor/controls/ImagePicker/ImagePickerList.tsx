import {PersistedAsset} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {Box, HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal, For, Show, Suspense} from 'solid-js';
import * as styles from './ImagePicker.css';

interface ImagePickerListProps {
  value?: string;
  images: PersistedAsset[];
  onChange: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

export function ImagePickerList(props: ImagePickerListProps) {
  return (
    <div
      class={styles.imageGrid}
      style={assignInlineVars({
        [styles.gridSize]: String(props.images?.length ?? 0),
      })}
    >
      <Suspense>
        <For each={props.images.map(image => image.id)}>
          {assetId => (
            <ImagePickerListItem
              assetId={assetId}
              active={assetId === props.value}
              onChange={props.onChange}
              onDelete={props.onDelete}
            />
          )}
        </For>
      </Suspense>
    </div>
  );
}

interface ImagePickerListItemProps {
  assetId: string;
  active?: boolean;
  onChange: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

function ImagePickerListItem(props: ImagePickerListItemProps) {
  const [status, setStatus] = createSignal<'error' | 'ready' | undefined>();

  return (
    <div class={styles.imageListItem}>
      <div
        class={styles.imagesCard}
        data-active={props.active ? '' : undefined}
        data-ready={status() === 'ready' ? '' : undefined}
        onClick={() => {
          if (status() === 'ready') {
            props.onChange(props.assetId);
          }
        }}
      >
        <ImagePickerAssetImage
          onError={() => setStatus('error')}
          onLoad={() => setStatus('ready')}
          assetId={props.assetId}
        />
        <Box marginTop={3} display={'flex'} justifyContent={'center'}>
          <ImagePickerDeleteButton
            onDelete={() => props.onDelete(props.assetId)}
          />
        </Box>
      </div>
    </div>
  );
}

interface ImagePickerAssetImageProps {
  assetId: string;
  onLoad: () => void;
  onError: () => void;
}

function ImagePickerAssetImage(props: ImagePickerAssetImageProps) {
  return (
    <Suspense fallback={<SkeletonLine width={'100%'} height={'100%'} />}>
      <div style={{height: '90px'}}>
        <AssetsImage
          class={styles.assetImagePreview}
          onLoad={props.onLoad}
          onError={props.onError}
          assetId={props.assetId}
        />
      </div>
    </Suspense>
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
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Delete
        </Button>
      </HStack>
    </Show>
  );
}
