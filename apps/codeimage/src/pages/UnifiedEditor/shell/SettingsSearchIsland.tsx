import {createSolid2Island} from '@core/solid2-islands/create-solid2-island';
import {mountSettingsSearch} from 'virtual:codeimage-solid2-islands';
import {searchIsland} from './settings-search-island.css';

export default createSolid2Island(mountSettingsSearch, {
  class: searchIsland,
  name: 'settings-search',
});
