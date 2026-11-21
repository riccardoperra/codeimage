import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import type {PersistedAsset} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {Box, HStack} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSignal, For, Show, Loading} from 'solid-js';
import * as styles from '../../../components/PropertyEditor/controls/ImagePicker/ImagePicker.css';

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
      <Loading>
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
      </Loading>
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
    <Loading fallback={<SkeletonLine width={'100%'} height={'100%'} />}>
      <div style={{height: '90px'}}>
        <AssetsImage
          class={styles.assetImagePreview}
          onLoad={props.onLoad}
          onError={props.onError}
          assetId={props.assetId}
        />
      </div>
    </Loading>
  );
}

interface ImagePickerDeleteButtonProps {
  onDelete: () => void;
}

function ImagePickerDeleteButton(props: ImagePickerDeleteButtonProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [deleting, setDeleting] = createSignal(false);
  return (
    <Show
      fallback={
        <Button
          block
          size={'xs'}
          aria-label={t('presets.deletePreset.label')}
          variant={'secondary'}
          onClick={() => setDeleting(true)}
        >
          {t('presets.deletePreset.label')}
        </Button>
      }
      when={deleting()}
    >
      <HStack spacing={2} width={'100%'}>
        <Button
          block
          size={'xs'}
          aria-label={t('presets.deletePreset.label')}
          variant={'secondary'}
          onClick={() => setDeleting(false)}
        >
          {t('lineMarks.undo')}
        </Button>
        <Button
          block
          size={'xs'}
          aria-label={t('presets.deletePreset.label')}
          variant={'negative'}
          onClick={(e: MouseEvent) => {
            props.onDelete();
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {t('presets.deletePreset.label')}
        </Button>
      </HStack>
    </Show>
  );
}
