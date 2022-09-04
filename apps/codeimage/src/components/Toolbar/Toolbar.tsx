import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {Box, Button, HStack} from '@codeimage/ui';
import {Link} from '@solidjs/router';
import {Component, Show} from 'solid-js';
import {CodeImageLogo} from '../Icons/CodeImageLogo';
import {CollectionIcon} from '../Icons/Collection';
import {sidebarLogo} from '../Scaffold/Sidebar/Sidebar.css';
import {UserBadge} from '../UserBadge/UserBadge';
import {ExportButton} from './ExportButton';
import {ExportInNewTabButton} from './ExportNewTabButton';
import {ShareButton} from './ShareButton';
import * as styles from './Toolbar.css';
import {ToolbarSettingsButton} from './ToolbarSettings';
import {ToolbarSnippetName} from './ToolbarSnippetName';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const loggedIn = () => getAuth0State().loggedIn();
  const isRemote = () => !!getEditorSyncAdapter()?.snippetId();

  return (
    <div class={styles.wrapper}>
      <ToolbarSettingsButton />
      <Box display={'flex'} alignItems={'center'} marginLeft={5}>
        <div class={sidebarLogo}>
          <CodeImageLogo width={'140px'} />
        </div>
        <Show when={loggedIn()}>
          <Box marginLeft={16}>
            <Button
              as={Link}
              href={'/dashboard'}
              variant={'link'}
              theme={'secondary'}
            >
              <CollectionIcon />
              <Box marginLeft={2}>Dashboard</Box>
            </Button>
          </Box>
        </Show>
      </Box>

      <Show when={isRemote()} keyed={false}>
        <div class={styles.toolbarSnippetBox}>
          <ToolbarSnippetName />
        </div>
      </Show>

      <Box class={styles.actionBox} flexGrow={1}>
        <HStack marginLeft={'auto'} spacing={'2'}>
          <ShareButton showLabel={false} />

          <ExportInNewTabButton canvasRef={props.canvasRef} />

          <ExportButton canvasRef={props.canvasRef} />

          <UserBadge />
        </HStack>
      </Box>
    </div>
  );
};
