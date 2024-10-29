import actions from './actions';
import getters from './getters';
import mutations from './mutations';

import { getDefaultState } from './getDefaultState';

export default {
  namespaced: true,
  state () {
    return getDefaultState();
  },
  actions,
  mutations,
  getters
}
