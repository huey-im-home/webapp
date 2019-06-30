<template>
  <div class="bridge-setup">
    <p>Searching for bridges ({{ bridges.length }} found)...</p>
    <div class="found-bridge"
         @click="connectToBridge(bridge.internalipaddress)"
         v-for="bridge in bridges">
      <p>{{bridge.internalipaddress}}</p>
      <p>Press the button on your Hue, then click here to Connect &gt;</p>
    </div>

    <hr>
    <p>Having trouble finding your bridge? Enter the Bridge IP Address manually below</p>
    <input type="text" v-model="manualBridgeIp">
    <button v-on:click="connectToBridge(manualBridgeIp)">Connect</button>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import jsHue from 'jshue';

  const hue = jsHue();
  @Component({
    watch: {
      '$store.state.currentBridge'() {
        if (this.$store.state.currentBridge != null) {
          console.log('READY - GO TO MAIN SECTION!');
          this.$router.replace('lights');
        }
      },
    },
  })
  export default class BridgeSetup extends Vue {
    private bridges: any[] = [];
    private manualBridgeIp: string = '';

    private mounted(): void {
      // When we very first load we want to search for any previously stored bridges
      this.searchForBridges();
    }

    private searchForBridges(): void {
      console.info('Searching for bridges..');
      hue.discover().then((bridges: any[]) => {
        this.bridges = bridges;
        // If a found bridge matches a previously authenticated bridge, immediately pick it as the candidate.
        for (const bridge of bridges) {
          // Not we use Bridge ID for auto detected bridges, or the bridge IP for manually entered bridges.
          if (this.$store.state.users[bridge.id.toLowerCase()] !== undefined) {
            // Use this bridge as the current bridge
            this.$store.dispatch('setCurrentBridge', {
              id: bridge.id.toLowerCase(),
              ip: bridge.internalipaddress,
            });
          }
        }
      })
        .catch((error: Error) => {
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

      // Attempt to create a new user on the Bridge
      const bridge = hue.bridge(bridgeIp);
      bridge.createUser('com.heuyimhome/abc')
        .then((response: any) => {
          if (response.length && response[0].success) {
            // Successfully created new user.
            const username = response[0].success.username;
            // Get the config from the Bridge to make sure we have the bridge ID.
            bridge.user(this.$store.state.users[bridge.id])
              .getConfig()
              .then((config: any) => {
                // We now have the Bridge ID and username, add them to the Store.
                const bridgeId = config.bridgeid.toLowerCase();
                this.$store.dispatch('setUser', {
                  id: bridgeId,
                  username,
                });

                // Set the current Bridge ID as well so that we can start using the Bridge
                this.$store.dispatch('setCurrentBridge', {
                  id: bridgeId,
                  ip: bridgeIp,
                });
              });

          } else {
            // FAILED TO CREATE USER!
            // @TODO: Handle Error nicely on the UI
            console.error('Could not connect to Bridge: Please press link button');
          }
        })
        .catch((error: Error) => {
          // Unknown error... could be network related?
          // @TODO: Handle Error nicely on the UI
          console.error('Could not connect to Bridge:', error.message);
        });
    }

  }
</script>

<style lang="scss" scoped>
  .found-bridge {
    margin: 5px;
    padding: 5px;
    border: 1px solid black;
    background: #EFEFEF;
    cursor: pointer;
  }

</style>
