import {getAuthState} from '@codeimage/store/auth/auth';
import {Box, Button, DropdownMenuV2, HStack, MenuButton} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import {Item} from '@solid-aria/collection';
import {
  createOverlayTriggerState,
  OverlayContainer,
} from '@solid-aria/overlays';
import {Link, useNavigate} from 'solid-app-router';
import {
  Component,
  createComponent,
  getOwner,
  runWithOwner,
  Show,
} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {CodeImageLogo} from '../Icons/CodeImageLogo';
import {CollectionIcon} from '../Icons/Collection';
import {DotHorizontalIocn} from '../Icons/DotVertical';
import {sidebarLogo} from '../Scaffold/Sidebar/Sidebar.css';
import {UserBadge} from '../UserBadge/UserBadge';
import {ExportButton} from './ExportButton';
import {SettingsDialog} from './SettingsDialog';
import * as styles from './Toolbar.css';
import {ToolbarSettingsButton} from './ToolbarSettings';
import {ToolbarSnippetName} from './ToolbarSnippetName';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  return (
    <div class={styles.wrapper}>
      <ToolbarSettingsButton />
      <Box
        display={'flex'}
        alignItems={'center'}
        flexGrow={1}
        marginLeft={5}
        marginTop={1}
      >
        <div class={sidebarLogo}>
          <CodeImageLogo width={'160px'} />
        </div>
      </Box>

      <ToolbarSnippetName />

      <Box class={styles.actionBox} style={{flex: 1}}>
        {/*<LanguageSelectorButton*/}
        {/*  locales={locales}*/}
        {/*  currentLocale={uiStore.locale}*/}
        {/*  onLocaleChange={setLocale}*/}
        {/*/>*/}

        {/*<ThemeToggleButton*/}
        {/*  theme={uiStore.themeMode}*/}
        {/*  onThemeToggle={toggleThemeMode}*/}
        {/*/>*/}

        <HStack marginLeft={'auto'} spacing={'2'}>
          <Button
            as={Link}
            href={'/dashboard'}
            variant={'solid'}
            theme={'secondary'}
          >
            <CollectionIcon />
            <Box marginLeft={2}>Go to dashboard</Box>
          </Button>

          <ExportButton canvasRef={props.canvasRef} />

          <UserBadge />
        </HStack>
      </Box>
    </div>
  );
};
