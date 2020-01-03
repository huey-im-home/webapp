<template>
  <div id="app" v-visibility-change="visibilityChange">
    <router-view/>
    <div id="app-version">v{{ this.APP_VERSION }}</div>
  </div>
</template>
<script lang="ts">
  import {Component, Prop, Watch, Vue} from 'vue-property-decorator';
  @Component
  export default class Main extends Vue {
    // APP_VERSION will be set during build time
    private APP_VERSION = require('../package.json').version;
    private mounted() {
      // If the user has saved the app to their home screen (e.g. Android or iOS),
      // their install may not update as frequently as the live version.
      // (As we are not using AppCache/Service Worker)
      // Try to manually do auto-updates by force refreshing the browser if this version is
      // out of sync with the live version

      // See file 'postBuild.js' in the project root for the build step that creates the version.json file.
      this.updateCheck();
    }

    private visibilityChange(evt: any, hidden: any) {
      if (!hidden) {
        this.updateCheck();
      }
    }

    private updateCheck() {
      if (process.env.NODE_ENV === 'production') {
        fetch('/version.json')
          .then((result: any) => result.json())
          .then((data: any) => {
            if (data.version !== this.APP_VERSION) {
              this.promptForNewVersion(data.version);
            }
          })
          .catch((error: Error) => {
            console.log('error', error);
          });
      }
    }

    private promptForNewVersion(versionNum: string) {
      this.$swal({
        title: `New version ${versionNum} available!`,
        type: 'info',
        showCancelButton: true,
        confirmButtonText: 'Update',
      }).then((result: any) => {
        if (result.value) {
          window.location.reload();
        }
      });
    }
  }
</script>
<style lang="scss">
* {
  box-sizing: border-box;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
#app-version {
  position: fixed;
  bottom: 10px;
  right: 10px;
  font-size: 12px;
  z-index: 1000;
}
</style>
