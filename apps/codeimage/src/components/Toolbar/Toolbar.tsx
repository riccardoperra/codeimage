import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {backgroundColorVar, Box, Button, colorVar, HStack} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {Link} from '@solidjs/router';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, Ref, Show, VoidProps} from 'solid-js';
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

interface ToolbarProps {
  canvasRef: HTMLElement | undefined;
  ref?: Ref<HTMLDivElement>;
}

export function Toolbar(props: VoidProps<ToolbarProps>) {
  const modality = useModality();
  const editor = getRootEditorStore();
  const {themeArray: themes} = getThemeStore();
  const loggedIn = () => getAuth0State().loggedIn();
  const isRemote = () => !!getEditorSyncAdapter()?.snippetId();

  const themeConfiguration = createMemo(
    () =>
      themes().find(
        theme => theme()?.id === editor.state.options.themeId,
      )?.() ?? themes()[0]?.()!,
  );

  function SnippetNameBox() {
    return (
      <div class={styles.toolbarSnippetBox}>
        <ToolbarSnippetName />
      </div>
    );
  }

  return (
    <div ref={props.ref}>
      <div class={styles.wrapper}>
        <ToolbarSettingsButton />
        <Box display={'flex'} alignItems={'center'} marginLeft={5}>
          <div class={sidebarLogo}>
            <CodeImageLogo width={'140px'} />
          </div>
          <Show when={loggedIn() && modality === 'full'}>
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

        <Show when={modality === 'full'} keyed={false}>
          <SnippetNameBox />
        </Show>

        <Box class={styles.actionBox} flexGrow={1}>
          <HStack marginLeft={'auto'} spacing={'2'}>
            <Show when={modality === 'full'} keyed={false}>
              <ShareButton showLabel={false} />

              <ExportInNewTabButton canvasRef={props.canvasRef} />

              <ExportButton canvasRef={props.canvasRef} />
            </Show>
            <UserBadge />
          </HStack>
        </Box>
      </div>
      <Show when={modality === 'mobile' && isRemote()} keyed={false}>
        <div
          class={styles.mobileToolbarSnippet}
          style={assignInlineVars({
            [backgroundColorVar]:
              themeConfiguration().properties.previewBackground,
            [colorVar]: themeConfiguration().properties.terminal.text,
          })}
        >
          <SnippetNameBox />
        </div>
      </Show>
    </div>
  );
}
