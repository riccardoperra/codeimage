/* eslint-disable @typescript-eslint/no-explicit-any */
import {Handler, HandlerCallbackMetadata, Wrap} from '@api/domain';
import {$HANDLER} from './handlers';

type HandlerBuilderData = {
  dependencies: any;
  input: any[];
  output: any;
  name: any;
};

type ExtendBuilder<
  T extends HandlerBuilderData,
  S extends Partial<HandlerBuilderData>,
> = Wrap<Omit<T, keyof S>> & S extends infer U
  ? U extends HandlerBuilderData
    ? U
    : never
  : never;

export class HandlerBuilder<T extends HandlerBuilderData> {
  private name!: T['name'];

  private callback!: (
    dependencies: T['dependencies'],
    metadata: HandlerCallbackMetadata,
  ) => (...args: NonNullable<T['input']>) => T['output'];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  static withDependencies = <T>(): HandlerBuilder<{
    dependencies: T;
    input: never;
    output: never;
    name: never;
  }> => {
    return new HandlerBuilder<{
      dependencies: T;
      input: never;
      output: never;
      name: never;
    }>();
  };

  withName = <TName extends string>(
    name: TName,
  ): HandlerBuilder<ExtendBuilder<T, {name: TName}>> => {
    this.name = name;
    return this as any;
  };

  withImplementation = <R extends (...args: any[]) => any>(
    handlerCallback: (
      dependencies: T['dependencies'],
      metadata: HandlerCallbackMetadata,
    ) => R,
  ): HandlerBuilder<
    ExtendBuilder<
      T,
      {
        input: Parameters<R>;
        output: ReturnType<R>;
      }
    >
  > => {
    this.callback = handlerCallback;
    return this as any;
  };

  build(): Handler<
    T['name'],
    Wrap<Required<Pick<T, 'input' | 'output' | 'dependencies'>>>
  > {
    Object.defineProperty(this.callback, $HANDLER, {value: {name: this.name}});
    return this.callback as any;
  }
}
