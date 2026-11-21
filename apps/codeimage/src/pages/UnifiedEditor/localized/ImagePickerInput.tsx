import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import type {
  PersistedAsset,
  PersistedFileAsset,
} from '@codeimage/store/assets/assets';
import {getAssetsStore} from '@codeimage/store/assets/assets';
import {Box, Text, themeVars} from '@codeimage/ui';
import {Button, Link, TextField} from '@codeui/kit';
import {createSignal} from 'solid-js';
import * as styles from '../../../components/PropertyEditor/controls/ImagePicker/ImagePicker.css';

interface ImagePickerInputProps {
  scope: string;
  onUpload: (asset: PersistedAsset) => void;
}

export function ImagePickerInput(props: ImagePickerInputProps) {
  const [t] = useI18n<AppLocaleEntries>();
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
          classes={{
            root: styles.textFieldImageUrl,
            input: styles.textFieldImageInput,
          }}
          size={'sm'}
          value={value()}
          onChange={setValue}
          placeholder={t('editor.imageUrl')}
        />
        <Button
          disabled={!value() || !value().startsWith('http')}
          class={styles.confirmButton}
          size={'sm'}
          aria-label={t('common.confirm')}
          variant={'primary'}
          onClick={() =>
            assetsStore.addLink(value(), props.scope).then(props.onUpload)
          }
        >
          {t('signature.upload')}
        </Button>
      </Box>
      <Box marginTop={2}>
        <Text size={'sm'}>
          <span
            style={{
              color: themeVars.dynamicColors.descriptionTextColor,
            }}
          >
            {t('editor.imageUrlOr')}{' '}
            <Link
              style={{'text-decoration': 'underline'}}
              onClick={() => {
                imageInputRef.click();
              }}
              variant={'underline'}
            >
              {t('editor.browseFiles')}
            </Link>
            <input
              type={'file'}
              accept={'image/x-png,image/gif,image/jpeg'}
              multiple={true}
              style={{display: 'none'}}
              onChange={event => {
                const files = event.currentTarget.files;
                if (!files) return;

                return Promise.allSettled(
                  Array.from(files).map(file =>
                    assetsStore.addFile(file, props.scope),
                  ),
                )
                  .then(results =>
                    results.find(
                      (
                        result,
                      ): result is PromiseFulfilledResult<PersistedFileAsset> =>
                        result.status === 'fulfilled',
                    ),
                  )
                  .then(file => file && props.onUpload(file.value));
              }}
              ref={imageInputRef}
            />
          </span>
        </Text>
      </Box>
    </div>
  );
}
