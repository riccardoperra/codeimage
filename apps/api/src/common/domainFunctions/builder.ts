import {
  Handler,
  HandlerCallbackMetadata,
  HandlerInternalMetadata,
  Wrap,
} from '@api/domain';
import {$HANDLER} from './handlers';

type HandlerBuilderData = {
  dependencies?: unknown;
  input?: unknown[];
  output?: unknown;
  name?: string;
};

type ExtendBuilder<
  T extends HandlerBuilderData,
  S extends Partial<HandlerBuilderData>,
> = Wrap<Omit<T, keyof S> & S> extends infer U
  ? U extends HandlerInternalMetadata
    ? U
    : never
  : never;

export class HandlerBuilder<T extends HandlerBuilderData> {
  private name: T['name'] = undefined;

  private callback!: (
    dependencies: T['dependencies'],
    metadata: HandlerCallbackMetadata,
  ) => (...args: T['input'] & unknown[]) => T['output'];

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

  withImplementation<R extends (...args: any[]) => any>(
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
  > {
    this.callback = handlerCallback;
    return this as any;
  }

  build(): Handler<
    T['name'] & string,
    Wrap<Required<Pick<T, 'input' | 'output' | 'dependencies'>>>
  > {
    return Object.assign(this.callback, {
      [$HANDLER]: {name: this.name},
    }) as unknown as Handler<T['name'] & string, any>;
  }
}
