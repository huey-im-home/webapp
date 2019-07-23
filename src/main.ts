import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import VueSlider from 'vue-slider-component';
import VueSweetalert2 from 'vue-sweetalert2';
import ToggleButton from 'vue-js-toggle-button';
import 'vue-slider-component/theme/default.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import 'vue-awesome/icons/palette';
import 'vue-awesome/icons/list-alt';
import 'vue-awesome/icons/regular/list-alt';
import Icon from 'vue-awesome/components/Icon.vue';

import LightGroup from '@/components/LightGroup.vue';
import LightControl from '@/components/LightControl.vue';
import IroColorPicker from '@/components/IroColorPicker.vue';

import './registerServiceWorker';

Vue.use(VueSweetalert2);
Vue.use(ToggleButton);
Vue.component('v-icon', Icon);

Vue.component('VueSlider', VueSlider);
Vue.component('LightGroup', LightGroup);
Vue.component('LightControl', LightControl);
Vue.component('IroColorPicker', IroColorPicker);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
