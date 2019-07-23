<template>
  <div class="bridge-setup">
    <h1>Huey I'm Home</h1>
    <p v-if="!bridges.length">Searching for bridges...</p>
    <p v-else>{{ bridges.length }} Bridge found</p>

    <div class="bridges">
      <div class="found-bridge"
           @click="connectToBridge(bridge.internalipaddress)"
           :key="key"
           v-for="(bridge, key) in bridges">
        <div class="button">
          <span>{{bridge.internalipaddress}}</span>
        </div>
        <p class="help">Press the button on your real Hue, then click here to Connect</p>
      </div>
    </div>
    <!--
    <hr>
    <p>Having trouble finding your bridge? Enter the Bridge IP Address manually below</p>
    <input type="text" v-model="manualBridgeIp">
    <button v-on:click="connectToBridge(manualBridgeIp)">Connect</button>
    -->
  </div>
</template>

<script lang="ts">
  import {Component, Watch, Vue} from 'vue-property-decorator';
  import HueBridge from '@/hue-api/HueBridge';

  @Component
  export default class BridgeSetup extends Vue {
    private pollRateMs: number = 2000; // API Long Poll rate in millis
    private bridges: HueBridge[] = [];
    private manualBridgeIp: string = '';

    private searchBridgesTimeoutHandle: number|undefined;

    private mounted(): void {
      // When we very first load we want to search for any previously stored bridges
      this.searchForBridges();
    }

    private beforeDestroy(): void {
      // Clear any long poll timers
      this.stopLongPolling();
    }

    @Watch('$store.state.currentBridge')
    private onCurrentBridgeChange(): void {
      if (this.$store.state.currentBridge != null) {
        console.log('READY - GO TO MAIN SECTION!');
        this.$router.replace('lights');
      }
    }

    /**
     * Start the Group and Light long pollers
     * @param immediate - Immediately fire the functions?
     */
    private startLongPolling(immediate: boolean): void {
      this.searchBridgesTimeoutHandle = setTimeout(this.searchForBridges, immediate ? 0 : this.pollRateMs);
    }

    private stopLongPolling(): void {
      clearTimeout(this.searchBridgesTimeoutHandle);
    }

    private searchForBridges(): void {
      console.info('Searching for bridges..');
      HueBridge.discover().then((bridges: HueBridge[]) => {
        this.bridges = bridges;
        // If a found bridge matches a previously authenticated bridge, immediately pick it as the candidate.
        for (const bridge of bridges) {
          // Not we use Bridge ID for auto detected bridges, or the bridge IP for manually entered bridges.
          if (bridge.id !== undefined && this.$store.state.users[bridge.id.toLowerCase()] !== undefined) {
            // Use this bridge as the current bridge
            this.$store.dispatch('setCurrentBridge', {
              id: bridge.id,
              ip: bridge.internalipaddress,
            });
          }
        }

        // Restart the long poll
        this.startLongPolling(false);
      })
        .catch((error: Error) => {
          // Restart the long poll
          this.startLongPolling(false);

          // Failed to auto discover bridges..
          // @TODO: Show a warning that the user should enter the IP manually??
          console.error(error);
        });
    }

    private connectToBridge(bridgeIp: string): void {
      // Check that the values have been entered correctly
      if (bridgeIp.trim() === '') {
        // @TODO: Show this warning somewhere in the UI
        console.error('Please enter Bridge IP address');
        return;
      }

      // @TODO: CHECK THAT AN EXISTING CONFIG DOESNT ALREADY EXIST!
      // Attempt to create a new user on the Bridge
      const bridge = new HueBridge(bridgeIp);
      bridge.createUser('com.heuyimhome')
        .then(() => {
          this.$store.dispatch('setUser', {
            id: bridge.id,
            username: bridge.username,
          });

          // Set the current Bridge ID as well so that we can start using the Bridge
          this.$store.dispatch('setCurrentBridge', {
            id: bridge.id,
            ip: bridgeIp,
          });
        })
        .catch((error: Error) => {
          // Unknown error... could be network related?
          // @TODO: Handle Error nicely on the UI
          this.$swal({
            type: 'error',
            title: 'Could not connect',
            text: 'Please make sure you press the button on your Bridge and try again.',
          });
          console.error('Could not connect to Bridge:', error.message);
        });
    }

  }
</script>

<style lang="scss" scoped>
  $circle-size: 120px;
  .found-bridge {
    display: inline-block;
    position: relative;
    text-align: center;
    margin: 5px;
    border: 1px solid #AAA;
    background: #EFEFEF;
    border-radius: $circle-size / 2;
    cursor: pointer;
    padding: 30px;

    width: $circle-size * 2.5;
    height: $circle-size * 2.5;

    .button {
      margin: auto;
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: block;
      width: $circle-size;
      height: $circle-size;
      border-radius: $circle-size;
      border: 2px solid #3498db;
      box-shadow: 0 0 10px #3498db;
      background-color: #FFF;

      transition: all 0.3s;

      span {
        line-height: $circle-size;
        font-weight: bold;
      }
    }

    .help {
      position: absolute;
      bottom: 0;
      left: 30px;
      right: 30px;
    }

    &:hover {
      .button {
        box-shadow: 0 0 20px #3498db;
      }
    }
  }

</style>
