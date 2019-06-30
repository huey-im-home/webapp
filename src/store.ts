import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  key: 'huey_im_home',
  reducer: (state: any) => ({
    users: state.users,
  }),
});

export default new Vuex.Store({
  state: {
    users: {}, // Bridges that have been authenticated with, keyed by bridge ID, value is username
    currentBridge: null,
  },
  mutations: {
    SET_USER(state: any, payload: any) {
      Vue.set(state.users, payload.id, payload.username);
    },
    SET_CURRENT_BRIDGE(state: any, bridge: object) {
      state.currentBridge = bridge;
    },
  },
  actions: {
    setCurrentBridge(store, bridge) {
      store.commit('SET_CURRENT_BRIDGE', {
        id: bridge.id,
        ip: bridge.ip,
      });
    },

    setUser(store, payload): void {
      store.commit('SET_USER', {
        id: payload.id, // Bridge ID
        username: payload.username, // The username returned by the bridge
      });
    },
  },
  getters: {
    currentBridgeUser(state) {
      // Merge the current Bridge and Username together for easy access
      if (state.currentBridge != null &&
          state.users[state.currentBridge.id] !== undefined) {
        return {
          id: state.currentBridge.id,
          ip: state.currentBridge.ip,
          username: state.users[state.currentBridge.id],
        };
      }

      return null;
    },
  },
  plugins: [vuexLocal.plugin],
});
