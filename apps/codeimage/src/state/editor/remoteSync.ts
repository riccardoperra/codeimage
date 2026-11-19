export interface RemoteProject {
  id: () => string | undefined;
  loggedIn: () => boolean;
  readOnly: () => boolean;
}

type Timer = ReturnType<typeof setTimeout>;

interface SaveLane {
  indicator?: Timer;
  save?: Timer;
  tail?: Promise<void>;
}

export function createRemoteSaves<T>(
  project: RemoteProject,
  save: (id: string, state: T) => Promise<unknown>,
  setPending: (pending: boolean) => void,
) {
  const lanes = new Map<string, SaveLane>();
  let disposed = false;

  function schedule(state: T) {
    const id = project.id();
    if (disposed || !id || !project.loggedIn() || project.readOnly()) return;
    const lane = lanes.get(id) ?? {};
    lanes.set(id, lane);
    clearTimeout(lane.indicator);
    lane.indicator = setTimeout(() => {
      if (project.id() === id) setPending(true);
      clearTimeout(lane.save);
      lane.save = setTimeout(() => {
        if (project.id() === id) setPending(false);
        const write = async () => {
          if (!disposed) await save(id, state);
        };
        lane.tail = (lane.tail?.then(write) ?? write()).catch(() => {});
      }, 3000);
    }, 150);
  }

  function dispose() {
    disposed = true;
    for (const lane of lanes.values()) {
      clearTimeout(lane.indicator);
      clearTimeout(lane.save);
    }
    lanes.clear();
  }

  return {schedule, dispose};
}
