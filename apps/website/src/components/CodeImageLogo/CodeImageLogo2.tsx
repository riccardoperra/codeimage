import {JSX} from 'solid-js';
import logo from './codeimage_logo_color.png';
import logoMobile from './codeimage_logo_color_mobile.webp';

export const CodeImageLogo2 = (props: JSX.IntrinsicElements['img']) => {
  return (
    <picture>
      <source type="image/webp" srcset={logoMobile} />
      <img src={logo} {...props} alt={'Preview of CodeImage snippet'} />
    </picture>
  );
};
