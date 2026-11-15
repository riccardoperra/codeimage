import {onCleanup} from 'solid-js';
import {withActivity} from './activity';
import {installDevtoolsTools, registerWebMcpTools} from './adapters';
import type {AgentTool} from './tools';
import {useSummaryWords} from './ToolActivity';

/**
 * Exposes the editor to browser AI agents, through WebMCP and Chrome DevTools
 * MCP, for as long as the stage lives. Renders nothing.
 */
export function AgentTools(props: {tools: readonly AgentTool[]}) {
  const words = useSummaryWords();
  onCleanup(registerWebMcpTools(withActivity(props.tools, 'webmcp', words)));
  onCleanup(installDevtoolsTools(withActivity(props.tools, 'devtools', words)));
  return null;
}
