import {JSX} from 'solid-js';
import {useAssets} from 'solid-js/web';
import logo from './codeimage-logo-blue-xxxs.webp';

export const CodeImageLogoSvgRemote = (props: JSX.IntrinsicElements['img']) => {
  useAssets(() => <link rel="preload" as="image" href={logo} />);

  return (
    <picture style={{display: 'flex'}}>
      <source type="image/webp" srcset={logo} />
      <img src={logo} alt={'CodeImage logo svg'} {...props} />
    </picture>
  );
};
