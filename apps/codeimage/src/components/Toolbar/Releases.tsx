import {useI18n} from '@codeimage/locale';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  HStack,
} from '@codeimage/ui';
import {ParentProps} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
// @filename: ../../test.json
import blocks from '../../test.json';
type KeysCFG =
  | 'paragraph'
  | 'bulleted_list_item'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'image';

type ImageNotion = {
  caption: any[];
  type: string;
  external: {
    url: string;
  };
};
type RichText = {
  type: string;
  text: {
    content: string;
    link: null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: null;
};
const CFG = {
  image: (image: ImageNotion) => <img src={image.external.url} />,
  heading_2: (heading2: RichText[]) =>
    heading2.map(h => <h2>{h.plain_text}</h2>),
};
export function Releases(props: ParentProps<{onClose?: () => void}>) {
  const [t] = useI18n<AppLocaleEntries>();
  const headers2 = blocks.map(element => {
    if (element.heading_2) {
      return CFG.heading_2(element.heading_2.rich_text);
    }
  });
  return (
    <Dialog size={'lg'} isOpen title={'Releases Notess'} {...props}>
      <DialogPanelContent>
        <h1> content</h1>
        {headers2}
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            size={'md'}
            type="button"
            variant={'solid'}
            theme={'secondary'}
            onClick={() => props.onClose?.()}
          >
            {t('common.close')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
