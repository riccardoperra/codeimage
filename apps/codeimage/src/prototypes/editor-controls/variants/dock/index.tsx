import {Canvas} from '../../../../components/Scaffold/Canvas/Canvas';
import type {VariantMeta, VariantProps} from '../../contract';
import {ModelDump} from '../../ModelDump';

export const meta: VariantMeta = {
  name: 'Dock',
  axis: 'TBD by builder',
};

export default function Dock(props: VariantProps) {
  return (
    <div style={{display: 'flex', height: '100vh'}}>
      <Canvas>
        <props.stage.Canvas />
      </Canvas>
      <aside style={{width: '360px', overflow: 'auto', padding: '16px'}}>
        <ModelDump model={props.model} stage={props.stage} />
      </aside>
    </div>
  );
}
