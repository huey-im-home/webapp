import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import VueSlider from 'vue-slider-component';
import './registerServiceWorker';
import 'vue-slider-component/theme/default.css';
import LightControl from '@/components/LightControl.vue';

Vue.component('VueSlider', VueSlider);
Vue.component('LightControl', LightControl);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
