import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  key: 'huey_im_home',
  reducer: (state: any) => ({
    users: state.users,
    groupToggleStates: state.groupToggleStates,
  }),
});

export default new Vuex.Store({
  state: {
    users: {}, // Bridges that have been authenticated with, keyed by bridge ID, value is username
    currentBridge: null,
    groupToggleStates: {}, // States of the group/light toggles, keyed by bridge ID, then by Group Name
  },
  mutations: {
    SET_USER(state: any, payload: any) {
      Vue.set(state.users, payload.id, payload.username);
    },
    UNSET_USER(state: any, id: string) {
      Vue.delete(state.users, id);
    },
    SET_CURRENT_BRIDGE(state: any, bridge: object) {
      state.currentBridge = bridge;
    },
    SET_GROUP_LIGHT_TOGGLE_STATE(state: any, payload: any) {
      const currentState = {
        ...state.groupToggleStates[state.currentBridge.id],
      };
      currentState[payload.name] = payload.state;
      Vue.set(state.groupToggleStates, state.currentBridge.id, currentState);
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

    logoutCurrentBridge(store): void {
      // Remove the auth settings for the current bridge
      if (store.state.currentBridge != null) {
        // store.commit('UNSET_USER', store.state.currentBridge.id);
        store.commit('SET_CURRENT_BRIDGE', null);
      }
    },

    setGroupLightToggleState(store, payload): void {
      store.commit('SET_GROUP_LIGHT_TOGGLE_STATE', {
        name: payload.name, // Group Name
        state: payload.state, // (bool) Show group or individual lights
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

    currentBridgeGroupToggleStates(state) {
      if (state.currentBridge != null &&
          state.groupToggleStates[state.currentBridge.id] !== undefined) {
        return state.groupToggleStates[state.currentBridge.id];
      }

      return null;
    },
  },
  plugins: [vuexLocal.plugin],
});
