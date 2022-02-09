import * as styles from './Header.css';
import {Button} from '../../ui/Button/Button';
import {sprinkles} from '../../../theme/sprinkles.css';

export const Header = () => {
  return (
    <nav class={styles.header}>
      <div class={styles.content}>
        <div
          class={sprinkles({
            marginLeft: 'auto',
          })}
        >
          <Button
            class={sprinkles({
              marginRight: '2',
            })}
            variant={'outline'}
            theme={'primary'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{height: '20px', width: '20px'}}
              fill="white"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span class={sprinkles({marginLeft: '2'})}>Share</span>
          </Button>

          <Button
            class={sprinkles({
              marginLeft: 'auto',
            })}
            variant={'solid'}
            theme={'primary'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{height: '20px', width: '20px'}}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span class={sprinkles({marginLeft: '2'})}>Export</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
