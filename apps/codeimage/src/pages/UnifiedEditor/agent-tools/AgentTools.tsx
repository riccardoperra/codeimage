import {onCleanup} from 'solid-js';
import {installDevtoolsTools, registerWebMcpTools} from './adapters';
import type {AgentTool} from './tools';

/**
 * Exposes the editor to browser AI agents, through WebMCP and Chrome DevTools
 * MCP, for as long as the stage lives. Renders nothing.
 */
export function AgentTools(props: {tools: readonly AgentTool[]}) {
  onCleanup(registerWebMcpTools(props.tools));
  onCleanup(installDevtoolsTools(props.tools));
  return null;
}
