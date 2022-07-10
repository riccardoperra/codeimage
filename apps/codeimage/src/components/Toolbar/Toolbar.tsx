import {Box, Button, HStack, Text} from '@codeimage/ui';
import {Link, useRouteData} from 'solid-app-router';
import {Component} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {WorkspaceItem} from '../../pages/Dashboard/Dashboard';
import {ChevronDownIcon} from '../Icons/ChevronDown';
import {CodeImageLogo} from '../Icons/CodeImageLogo';
import {CollectionIcon} from '../Icons/Collection';
import {DotVerticalIcon} from '../Icons/DotVertical';
import {sidebarLogo} from '../Scaffold/Sidebar/Sidebar.css';
import {UserBadge} from '../UserBadge/UserBadge';
import {ExportButton} from './ExportButton';
import * as styles from './Toolbar.css';
import {ToolbarSnippetName} from './ToolbarSnippetName';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const {locales} = appEnvironment;

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} alignItems={'center'} flexGrow={1}>
        <div class={sidebarLogo} style={{marginLeft: '1rem'}}>
          <CodeImageLogo width={'140px'} />
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

          <DotVerticalIcon />
        </HStack>
      </Box>
    </div>
  );
};
