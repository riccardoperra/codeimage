import {createContext, ParentProps, useContext} from 'solid-js';
import $dashboardState, {DashboardState} from './dashboard.state';

export const DashboardContext = createContext<DashboardState>();

export function DashboardProvider(props: ParentProps) {
  return (
    <DashboardContext.Provider value={$dashboardState()}>
      {props.children}
    </DashboardContext.Provider>
  );
}

export function getDashboardState(): DashboardState {
  return useContext(DashboardContext)!;
}
