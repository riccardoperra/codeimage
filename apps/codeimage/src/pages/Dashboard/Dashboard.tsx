import {Box} from '@codeimage/ui';
import {Footer} from '../../components/Footer/Footer';
import {DashboardHeader} from './components/DashboardHeader/DashboardHeader';
import {ProjectList} from './components/ProjectList/ProjectList';
import {ProjectToolbar} from './components/ProjectToolbar/ProjectToolbar';
import * as styles from './Dashboard.css';
import {DashboardProvider} from './dashboard.state';

export function DashboardContent() {
  return (
    <div class={styles.scaffold}>
      <Box display={'flex'} height={'100%'}>
        <div class={styles.wrapper}>
          <DashboardHeader />

          <div class={styles.main}>
            <ProjectToolbar />

            <Box class={styles.scrollableList}>
              <ProjectList />
            </Box>
          </div>

          <Footer />
        </div>
      </Box>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
