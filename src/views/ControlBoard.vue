<template>
  <div id="light-controls">
    <h1>Huey I'm Home</h1>
    <div class="hue-groups">
      <div class="hue-group"
           v-for="(group, groupId) in groups"
           v-if="group.lights.length > 0"
           :key="groupId">
        <p>{{group.name}}</p>

        <light-control
            :state="groups[groupId].action"
            @onstatechange="onGroupChange(groupId, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue, Watch} from 'vue-property-decorator';
  import { debounce } from 'ts-debounce';
  import {HueState} from '@/hue-api/HueState';
  import HueBridge from '@/hue-api/HueBridge';

  @Component
  export default class LightControls extends Vue {
    private debounceRateMs: number = 400; // Throttle/debounce rate in millis
    private pollRateMs: number = 2000; // API Long Poll rate in millis
    private bridge?: HueBridge;
    private lights: any = {}; // Will be keyed by Group ID
    private groups: any = {}; // Will be keyed by Light ID

    private getGroupsTimeoutHandle: number|undefined;
    private getLightsTimeoutHandle: number|undefined;

    // Wrap setGroupState() in a debouncer to avoid spamming the bridge on update
    private setGroupStateDebounced: any = debounce(this.setGroupState, this.debounceRateMs);

    /**
     * Vue LIFECYCLE METHODS
     */
    private mounted(): void {
      // Grab the current Bridge and check that we still have access to it
      if (!this.checkValidBridgeUser()) {
        return;
      }

      this.bridge = new HueBridge(
        this.$store.getters.currentBridgeUser.ip,
        this.$store.getters.currentBridgeUser.username,
      );

      // Get our initial data from the bridge
      this.startLongPolling(true);
    }

    private beforeDestroy(): void {
      // Clear any long poll timers
      this.stopLongPolling();
    }

    @Watch('$store.getters.currentBridgeUser')
    private checkValidBridgeUser(): boolean {
      if (this.$store.getters.currentBridgeUser == null) {
        // We don't have a valid config, go back to the setup page
        this.$router.replace('/');
        return false;
      }

      return true;
    }
    /**
     * INSTANCE METHODS
     */

    // Handler for the hue-group ongroupchange event
    private onGroupChange(groupId: string, state: HueState): void {
      // Merge in the updated values
      this.groups[groupId].action = {
        ...this.groups[groupId].action,
        ...state,
      };
      // Cancel long polling so it doesn't incorrectly update the group/light state while we are changing it.
      // We will resume it in the debounce handler
      this.stopLongPolling();
      this.setGroupStateDebounced(groupId, state);
    }

    private setGroupState(groupId: string, state: HueState) {
      // console.log('setGroupState', groupId, state);
      // Update the bridge with the new value
      if (this.bridge) {
        this.bridge.setGroupState(groupId, state);
      }

      this.startLongPolling(false);
    }

    /**
     * HELPER METHODS
     */
    // Fetch all Groups from the Bridge
    private getGroups(): void {
      if (this.bridge) {
        this.bridge.getGroups()
          .then((groups: any) => {
            this.groups = groups;
            // We want to 'watch' the groups..
            this.getGroupsTimeoutHandle = setTimeout(this.getGroups, this.pollRateMs);
          })
          .catch((error: Error) => {
            console.error('Failed to get Groups: ', error);
            this.logoutCurrentBridge();
          });
      }
    }

    // Fetch all Groups from the Bridge
    private getLights(): void {
      if (this.bridge) {
        this.bridge.getLights()
          .then((lights: any) => {
            this.lights = lights;
            // We want to 'watch' the lights..
            this.getLightsTimeoutHandle = setTimeout(this.getLights, this.pollRateMs);
          })
          .catch((error: Error) => {
            console.error('Failed to get Lights: ', error);
            this.logoutCurrentBridge();
          });
      }
    }

    private logoutCurrentBridge(): void {
      this.$swal({
        type: 'error',
        text: 'Connection to bridge lost',
      });
      this.$store.dispatch('logoutCurrentBridge');
    }

    /**
     * Start the Group and Light long pollers
     * @param immediate - Immediately fire the functions?
     */
    private startLongPolling(immediate: boolean): void {
      this.getGroupsTimeoutHandle = setTimeout(this.getGroups, immediate ? 0 : this.pollRateMs);
      this.getLightsTimeoutHandle = setTimeout(this.getLights, immediate ? 0 : this.pollRateMs);
    }

    private stopLongPolling(): void {
      clearTimeout(this.getGroupsTimeoutHandle);
      clearTimeout(this.getLightsTimeoutHandle);
    }
  }
</script>

<style lang="scss" scoped>
  .hue-groups {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
  }
  .hue-group {
    padding: 10px;
    flex-grow: 1;
  }
</style>
