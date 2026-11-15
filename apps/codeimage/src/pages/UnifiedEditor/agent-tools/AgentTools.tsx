import {onCleanup} from 'solid-js';
import type {Accessor} from 'solid-js';
import {createListedModel} from '../command-menu/listed-model';
import type {EditorControlsModel} from '../model';
import type {EditorPageState} from '../page-state';
import type {Stage} from '../stage';
import {installDevtoolsTools, registerWebMcpTools} from './adapters';
import {createAgentTools} from './tools';

/**
 * Exposes the editor to browser AI agents, through WebMCP and Chrome DevTools
 * MCP, for as long as the stage lives. Renders nothing.
 */
export function AgentTools(props: {
  model: EditorControlsModel;
  stage: Stage;
  pageState: Accessor<EditorPageState>;
}) {
  const tools = createAgentTools({
    model: props.model,
    listed: createListedModel(props.model),
    exporter: props.stage.exporter,
    pageState: props.pageState,
  });
  onCleanup(registerWebMcpTools(tools));
  onCleanup(installDevtoolsTools(tools));
  return null;
}
