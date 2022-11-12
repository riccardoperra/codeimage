import {JSX} from 'solid-js';
import logo from './codeimage_logo.png';

export const CodeImageLogo2 = (props: JSX.IntrinsicElements['img']) => {
  return <img src={logo} {...props} />;
};
