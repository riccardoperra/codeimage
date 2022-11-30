import {JSX} from 'solid-js';
import {useAssets} from 'solid-js/web';
import logo from './codeimage-logo-blue-low-v1.png';

export const CodeImageLogoSvgRemote = (props: JSX.IntrinsicElements['img']) => {
  useAssets(() => <link rel="preload" as="image" href={logo} />);

  return (
    <picture>
      <source type="image/webp" srcset={logo} />
      <img src={logo} alt={'CodeImage logo svg'} {...props} />
    </picture>
  );
};
