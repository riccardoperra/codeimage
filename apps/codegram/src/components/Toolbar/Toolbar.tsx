import * as styles from './toolbar.css';
import {Button} from '../ui/Button/Button';
import {sprinkles} from '../../theme/sprinkles.css';
import {Component} from 'solid-js';
import {exportImage} from '../../state/frame.state';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const sizes = [16, 32, 64, 128];

  return (
    <div class={styles.wrapper}>
      <div class="flex flex-col gap-1 items-center text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add</span>
      </div>

      <div class="flex flex-col gap-1 justify-center items-center text-xs ml-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <span>Theme</span>
      </div>

      <div class="flex flex-col gap-1 justify-center items-center text-xs ml-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>Canvas</span>
      </div>

      <div class="flex flex-col gap-1 justify-center items-center text-xs ml-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>Code</span>
      </div>

      <div class="ml-auto mr-2">
        <Button theme="secondary" variant="solid">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </Button>
      </div>
      <div>
        <div
          class={sprinkles({
            marginLeft: 'auto',
          })}
        >
          <Button
            class={sprinkles({
              marginLeft: 'auto',
            })}
            variant={'solid'}
            theme={'primary'}
            onClick={() => exportImage(props.canvasRef as HTMLElement)}
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

      {/*<Button*/}
      {/*  class={sprinkles({*/}
      {/*    marginLeft: 'auto',*/}
      {/*  })}*/}
      {/*  variant={'solid'}*/}
      {/*  theme={'primary'}*/}
      {/*>*/}
      {/*  Export*/}
      {/*</Button>*/}
    </div>
  );
};
