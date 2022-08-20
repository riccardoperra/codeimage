import {Box, Button, Text, VStack} from '@codeimage/ui';
import {useNavigate} from 'solid-app-router';
import {Show} from 'solid-js';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import {getDashboardState} from '../../dashboard.state';
import {CreateNewProjectButton} from '../CreateNewProjectButton/CreateNewProjectButton';
import * as styles from './ProjectList.css';

function EmptyBox() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 1000 1000"
      enable-background="new 0 0 1000 1000"
      fill={'currentColor'}
      width={'200'}
      height={'200'}
    >
      <g>
        <path d="M871.5,381L504.7,196L628.1,45.1L990,238.2L871.5,381L871.5,381z M10,235L380,45.1l118.5,150.9L135,381L10,235L10,235z M498.2,555.3l-64.9,183.4L69.8,555.3l64.9-173.6L498.2,555.3L498.2,555.3z M440.6,766.6l54.8-142.8v331L112,777.2l1.2-176.1L440.6,766.6L440.6,766.6z M944.5,553.6L568,737l-61.7-181.7l365.2-173.6L944.5,553.6L944.5,553.6z M891,602.3v174.9L508.8,954.9v-331L559.6,767L891,602.3L891,602.3z" />
      </g>
    </svg>
  );
}

export function ProjectEmptyListMessage() {
  const dashboard = getDashboardState()!;

  const noMatchingProjects = () => {
    return (
      dashboard.search().length > 0 &&
      !dashboard.filteredData().length &&
      dashboard.data().length
    );
  };

  return (
    <div class={styles.fallbackContainer}>
      <EmptyBox />

      <Show
        when={noMatchingProjects()}
        fallback={
          <>
            <Text size={'2xl'} class={styles.fallbackTextTitle}>
              No projects yet
            </Text>
            <Text size={'base'}>
              Create a new project from scratch <br /> and share your snippets.
            </Text>
            <Box marginTop={5}>
              <CreateNewProjectButton />
            </Box>
          </>
        }
      >
        <Text size={'2xl'} class={styles.fallbackTextTitle}>
          No result
        </Text>
        <Text size={'base'}>
          Oops! There are no projects <br />
          matching your search.
        </Text>
      </Show>
    </div>
  );
}
