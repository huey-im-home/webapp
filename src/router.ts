import Vue from 'vue';
import Router from 'vue-router';
import BridgeSetup from './views/BridgeSetup.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'bridge-setup',
      component: BridgeSetup,
    },
    {
      path: '/lights',
      name: 'lights',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "control-board" */ './views/ControlBoard.vue'),
    },
  ],
});
