import {Box, HStack} from '@codeimage/ui';
import {CodeImageLogoV2} from '../../../../components/Icons/CodeImageLogoV2';
import {sidebarLogo} from '../../../../components/Scaffold/Sidebar/Sidebar.css';
import {actionBox} from '../../../../components/Toolbar/Toolbar.css';
import {ToolbarSettingsButton} from '../../../../components/Toolbar/ToolbarSettings';
import {UserBadge} from '../../../../components/UserBadge/UserBadge';
import * as styles from './DashboardHeader.css';

export function DashboardHeader() {
  return (
    <div class={styles.header}>
      <div class={styles.headerContent}>
        <ToolbarSettingsButton />

        <Box display={'flex'} alignItems={'center'} flexGrow={1} marginLeft={5}>
          <div class={sidebarLogo}>
            <CodeImageLogoV2 width={'140px'} withGradient={true} />
          </div>
        </Box>

        <Box class={actionBox} flexGrow={1}>
          <HStack spacing={'2'} marginLeft={'auto'}>
            <UserBadge />
          </HStack>
        </Box>
      </div>
    </div>
  );
}
