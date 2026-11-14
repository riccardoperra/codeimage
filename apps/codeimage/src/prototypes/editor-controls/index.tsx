import {PrototypeRoute} from './harness';
import {variants} from './registry';

export default function EditorControlsPrototype() {
  return <PrototypeRoute variants={variants} themeStyles />;
}
