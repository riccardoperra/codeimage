import {OperatorFunction, filter} from 'rxjs';
import {StoreEvent} from './createStore';

type InferAction<T extends StoreEvent, Type extends T['type']> = T extends {
  type: Type;
}
  ? T
  : never;

export function ofType<
  Actions extends StoreEvent,
  C extends Actions['type'][] = Actions['type'][],
>(...creators: C): OperatorFunction<Actions, InferAction<Actions, C[number]>> {
  return filter((value): value is InferAction<Actions, C[number]> =>
    creators.some(creator => creator === value.type),
  );
}
