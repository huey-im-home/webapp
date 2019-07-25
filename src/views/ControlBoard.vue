<template>
  <div id="light-controls" :class="{vertical: isVertical, horizontal: !isVertical}">
    <div class="top">
      <h1>Huey I'm Home</h1>
      <toggle-button :value="allLightsToggleState"
                     class="all-lights-toggle"
                     color="#82C7EB"
                     :height="35"
                     :width="70"
                     v-on:change="toggleAllLights"
                     :sync="true"
                     :labels="false"
      />
    </div>


    <div class="light-groups" :class="{vertical: isVertical}">
      <light-group
           v-for="(group, groupId) in groups"
           v-if="group.lights.length > 0"
           :key="groupId"
           :is-vertical="isVertical"
           :group="group"
           :lights="getLightsForGroup(groupId)"
           @ongroupchange="onGroupChange(groupId, $event)"
           @onlightchange="onLightChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue, Watch} from 'vue-property-decorator';
  import { debounce } from 'ts-debounce';
  import {HueState} from '@/hue-api/HueState';
  import HueBridge from '@/hue-api/HueBridge';

  @Component
  export default class ControlBoard extends Vue {
    private debounceRateMs: number = 400; // Throttle/debounce rate in millis
    private pollRateMs: number = 2000; // API Long Poll rate in millis
    private bridge?: HueBridge;
    private lights: any = {}; // Will be keyed by Group ID
    private groups: any = {}; // Will be keyed by Light ID
    private allLightsToggleState: boolean = false;

    private getGroupsTimeoutHandle: number|undefined;
    private getLightsTimeoutHandle: number|undefined;

    // Wrap setGroupState() in a debouncer to avoid spamming the bridge on update
    private setGroupStateDebounced: any = debounce(this.setGroupState, this.debounceRateMs);
    private setLightStateDebounced: any = debounce(this.setLightState, this.debounceRateMs);

    get isVertical(): boolean {
      return window.innerWidth > 500;
    }

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
    private onGroupChange(groupId: number, state: HueState): void {
      // Cancel long polling so it doesn't incorrectly update the group/light state while we are changing it.
      // We will resume it in the debounce handler
      this.stopLongPolling();

      // Merge in the updated values to force an immediate UI update
      this.groups[groupId].action = {
        ...this.groups[groupId].action,
        ...state,
      };

      // Also update the child lights with the new values
      const groupLights = this.getLightsForGroup(groupId);
      for (const lightId in groupLights) {
        if (groupLights.hasOwnProperty(lightId)) {
          // Not all lights support other values, such as color values, check before assigning these attributes
          for (const stateKey in state) {
            if (groupLights[lightId].state[stateKey] !== undefined) { // This light supports this attribute
              groupLights[lightId].state[stateKey] = (state as any)[stateKey];
            }
          }
        }
      }

      // Check that the master light toggle is in the correct state
      this.updateAllLightsToggleState();

      this.setGroupStateDebounced(groupId, state); // Will fire setGroupState() after debouncing
    }

    // Set the Group State via the Bridge API
    private setGroupState(groupId: string, state: HueState) {
      // Update the bridge with the new value
      if (this.bridge) {
        this.bridge.setGroupState(groupId, state).then(() => {
          this.startLongPolling(true);
        });
      } else {
        this.startLongPolling(false);
      }
    }

    // Handler for the light group onlightchange event
    private onLightChange(lightId: number, state: HueState) {
      // Cancel long polling so it doesn't incorrectly update the group/light state while we are changing it.
      // We will resume it in the debounce handler
      this.stopLongPolling();

      // Merge in the updated values to force an immediate UI update
      this.lights[lightId].state = {
        ...this.lights[lightId].state,
        ...state,
      };

      // We also need to update the parent group
      const group = this.getGroupForLight(lightId);
      // Note: This may not work perfectly with groups containing multiple lights
      group.action = {
        ...group.action,
        ...state,
      };

      // Check that the master light toggle is in the correct state
      this.updateAllLightsToggleState();

      this.setLightStateDebounced(lightId, state);
    }

    // Set the Light State via the Bridge API
    private setLightState(lightId: string, state: HueState) {
      if (this.bridge) {
        this.bridge.setLightState(lightId, state).then(() => {
          this.startLongPolling(true);
        });
      } else {
        this.startLongPolling(false);
      }
    }

    // Update the master light toggle - if all lights are OFF, or if any are on
    private updateAllLightsToggleState(): void {
      // Update the 'all lights' master toggle state by checking if all lights are on
      this.allLightsToggleState = false;
      for (const lightId in this.lights) {
        if (this.lights.hasOwnProperty(lightId)) {
          if (this.lights[lightId].state.on) {
            // Make sure we sync with Vue so the UI updates
            this.$nextTick(() => {
              this.allLightsToggleState = true;
            });
            break;
          }
        }
      }
    }

    // Handler for the Master Light Toggle switch
    private toggleAllLights(event: any): void {
      this.allLightsToggleState = event.value;

      // We need to toggle ALL lights on/off in the api
      const state: HueState = {
        on: event.value,
      };

      this.stopLongPolling();

      // Force update all Groups with the new setting
      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId)) {
          this.groups[groupId].action = {
            ...this.groups[groupId].action,
            ...state,
          };
        }
      }

      // Put the promises in an array so we can use Promise.all() to restart long polling after *all* updates
      const promises: any[] = [];

      // Update each light
      for (const lightId in this.lights) {
        if (this.lights.hasOwnProperty(lightId) && this.bridge) {
          // Merge in the updated values to force an immediate UI update
          this.lights[lightId].state = {
            ...this.lights[lightId].state,
            ...state,
          };

          promises.push(this.bridge.setLightState(lightId, state));
        }
      }

      Promise.all(promises).then(() => {
        this.startLongPolling(true);
      });
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

            // Check that the master light toggle is in the correct state
            this.updateAllLightsToggleState();

            // We want to 'watch' the lights..
            this.getLightsTimeoutHandle = setTimeout(this.getLights, this.pollRateMs);
          })
          .catch((error: Error) => {
            console.error('Failed to get Lights: ', error);
            this.logoutCurrentBridge();
          });
      }
    }

    /**
     * For a given groupId, pluck out the lights associated with that group
     * @param groupId: The ID of the group to get lights for
     * @return any: Object of lights, keyed by light ID
     */
    private getLightsForGroup(groupId: number): any {
      const lights: any = {};
      for (const lightId of this.groups[groupId].lights) {
        if (this.lights.hasOwnProperty(lightId)) {
          lights[lightId] = this.lights[lightId];
        }
      }
      return lights;
    }

    /**
     * For a given lightId, find the group that it belongs to
     * @param lightId: The ID of the light to get a group for
     * @return any: The Group that contains this light
     */
    private getGroupForLight(lightId: number): any|null {
      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId) &&
                this.groups[groupId].lights.indexOf(lightId) > -1) {
          return this.groups[groupId];
        }
      }
      return null;
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
      this.stopLongPolling(); // Make sure we don't create multiple callbacks
      this.getGroupsTimeoutHandle = setTimeout(this.getGroups, immediate ? 0 : this.pollRateMs);
      this.getLightsTimeoutHandle = setTimeout(this.getLights, immediate ? 0 : this.pollRateMs);
    }

    // Stop long polling by clearing out any long poll timeouts
    private stopLongPolling(): void {
      clearTimeout(this.getGroupsTimeoutHandle);
      clearTimeout(this.getLightsTimeoutHandle);
    }
  }
</script>

<style lang="scss">
  #light-controls {
    .top {
      h1,
      .all-lights-toggle {
        display: inline-block;
        vertical-align: middle;
      }
    }
    h1 {
      margin-left: 10px;
      margin-right: 10px;
    }
    &.vertical {
      .all-lights-toggle {
        margin-right: -75px;
      }
    }
  }
  .light-groups {
    &.vertical {
      display: flex;
      flex-wrap: nowrap;
      align-items: flex-start;

      .light-group {
        flex-grow: 1;
      }
    }
  }
  .light-group {
    padding: 10px;
  }
</style>
