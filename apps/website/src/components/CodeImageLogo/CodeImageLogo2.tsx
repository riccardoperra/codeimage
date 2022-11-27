import {JSX} from 'solid-js';
import {useAssets} from 'solid-js/web';

export const CodeImageLogo2 = (props: JSX.IntrinsicElements['img']) => {
  useAssets(() => (
    <link
      rel="preload"
      as="image"
      href="/brand/codeimage_logo_color_mobile.webp"
    />
  ));

  return (
    <picture>
      <source
        type="image/webp"
        srcset={'/brand/codeimage_logo_color_mobile.webp'}
      />
      <img
        src={'/brand/codeimage_logo_color.png'}
        alt={'Preview of CodeImage snippet'}
        {...props}
      />
    </picture>
  );
};
