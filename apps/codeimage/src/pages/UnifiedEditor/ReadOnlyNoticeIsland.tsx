import {createSolid2Island} from '@core/solid2-islands/create-solid2-island';
import {mountReadOnlyNotice} from 'virtual:codeimage-solid2-islands';
import {noticeIsland} from './snippet.css';

export default createSolid2Island(mountReadOnlyNotice, {
  name: 'read-only-notice',
  class: noticeIsland,
});
