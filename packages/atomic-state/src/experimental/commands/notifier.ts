import {filter, map, Observable, shareReplay, Subject} from 'rxjs';
import {batch, untrack} from 'solid-js';
import {reconcile, SetStoreFunction} from 'solid-js/store';
import {createTrackObserver} from '../../createTrackObserver';
import {Store} from '../store';
import {
  CommandPayload,
  createCommand,
  ExecutedGenericStateCommand,
  GenericStateCommand,
} from './command';

export type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  payload: CommandPayload<Command>,
  meta: {
    set: SetStoreFunction<T>;
    state: T;
  },
) => T | void;

export const [track, untrackCommand] = createTrackObserver();

export function makeCommandNotifier<T>(ctx: Store<T>) {
  const commandsSubject$ = new Subject<ExecutedGenericStateCommand>();

  const callbacks = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<T, GenericStateCommand>>
  >();

  commandsSubject$
    .pipe(
      map(command => {
        const resolvedCallbacks = callbacks.get(command.meta.identity) ?? [];
        return [command, resolvedCallbacks] as const;
      }),
      filter(([command]) => !command.meta.identity.endsWith('@Done')),
    )
    .subscribe(([command, callbacks]) => {
      batch(() => {
        untrack(() => {
          for (const callback of callbacks) {
            const result = callback(command.meta.consumerValue, {
              set: ctx.set,
              state: ctx.get(),
            });
            if (result !== undefined) {
              ctx.set(reconcile(result));
            }
          }
        });

        const doneCommand = createCommand(
          `${command.meta.identity}@Done`,
        ).withPayload<{
          source: GenericStateCommand;
          payload: unknown;
          state: T;
        }>();

        commandsSubject$.next(
          Object.assign(doneCommand, {
            meta: Object.assign(doneCommand.meta, {
              consumerValue: {
                source: command,
                payload: command.meta.consumerValue,
                state: ctx.get(),
              },
            }),
          }),
        );
      });
    });

  return {
    commandsSubject$,
    callbacks,
    track,
    untrackCommand,
    watchCommand<Commands extends GenericStateCommand>(commands?: Commands[]) {
      return (commandsSubject$ as Observable<Commands>).pipe(
        filter(command => {
          return !!(commands ?? []).find(
            x =>
              x.meta.identity === command.meta.identity &&
              !(x.meta as any).silent,
          );
        }),
        shareReplay({refCount: true, bufferSize: 1}),
      );
    },
    dispatch<Command extends GenericStateCommand>(
      command: Command,
      payload: CommandPayload<Command>,
    ): void {
      const resolvedCommand = !track()
        ? command.with({silent: true as const})
        : command;
      commandsSubject$.next(resolvedCommand.execute(payload));
    },
  };
}
