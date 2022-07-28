import {getAuthState} from '@codeimage/store/auth/auth';
import {Box, Button, HStack} from '@codeimage/ui';
import {Link} from 'solid-app-router';
import {Component, Show} from 'solid-js';
import {CodeImageLogo} from '../Icons/CodeImageLogo';
import {CollectionIcon} from '../Icons/Collection';
import {sidebarLogo} from '../Scaffold/Sidebar/Sidebar.css';
import {UserBadge} from '../UserBadge/UserBadge';
import {ExportButton} from './ExportButton';
import * as styles from './Toolbar.css';
import {ToolbarSettingsButton} from './ToolbarSettings';
import {ToolbarSnippetName} from './ToolbarSnippetName';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const loggedIn = () => getAuthState().loggedIn();

  return (
    <div class={styles.wrapper}>
      <ToolbarSettingsButton />
      <Box display={'flex'} alignItems={'center'} flexGrow={1} marginLeft={5}>
        <div class={sidebarLogo}>
          <CodeImageLogo width={'156px'} />
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

      <Box flexGrow={1}>
        <ToolbarSnippetName />
      </Box>

      <Box class={styles.actionBox} style={{flex: 1}}>
        <HStack marginLeft={'auto'} spacing={'2'}>
          <ExportButton canvasRef={props.canvasRef} />

          <UserBadge />
        </HStack>
      </Box>
    </div>
  );
};
