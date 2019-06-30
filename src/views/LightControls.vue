<template>
  <div id="light-controls">
    <h1>Lights</h1>

    <div class="hue-group"
         v-for="(group, groupId) in groups"
         v-if="group.lights.length > 0"
    >
      <h2>{{ group.name }}</h2>
      <input type="range"
             min="0"
             max="101"
             step="10"
             v-on:input="onGroupRangeChange($event, groupId)">
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import jsHue from 'jshue';
  const hue = jsHue();
  @Component({
  })
  export default class LightControls extends Vue {
    private bridge: any = null;
    private lights: any = {}; // Will be keyed by Group ID
    private groups: any = {}; // Will be keyed by Light ID

    private isUpdateInProgress: boolean = false;

    private mounted(): void {
      // Grab the current Bridge and check that we still have access to it
      if (this.$store.getters.currentBridgeUser == null) {
        // We don't have a valid config, go back to the setup page
        this.$router.replace('/');
        return;
      }

      this.bridge = hue.bridge(this.$store.getters.currentBridgeUser.ip)
        .user(this.$store.getters.currentBridgeUser.username);

      // Get our initial data from the bridge
      this.getGroups();
      this.getLights();
    }

    // Fetch all Groups from the Bridge
    private getGroups(): void {
      this.bridge.getGroups()
        .then((groups: any) => {
          this.groups = groups;
        })
        .catch((error: Error) => {
          // @TODO: Should we kick the user back to the setup page?
          console.error('Failed to get Groups: ', error);
        });
    }

    // Fetch all Groups from the Bridge
    private getLights(): void {
      this.bridge.getLights()
        .then((lights: any) => {
          this.lights = lights;
        })
        .catch((error: Error) => {
          // @TODO: Should we kick the user back to the setup page?
          console.error('Failed to get Lights: ', error);
        });
    }

    private onGroupRangeChange($event: any, groupId: string): void {
      // if (this.isUpdateInProgress) return; // Prevent spamming the bridge

      this.isUpdateInProgress = true;

      const brightness: number = Math.round(254 * (parseInt($event.target.value, 10) / 100));
      this.bridge.setGroupState(groupId, {bri: brightness}).then((result: any) => {
        this.isUpdateInProgress = false;
      });
    }
  }
</script>

<style lang="scss" scoped>

</style>
