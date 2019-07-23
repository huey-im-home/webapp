/**
 * Wrapper around the js-hue lib so as to provide TypeScript support
 */

import jsHue from 'jshue';
import {HueBridgeConfig} from '@/hue-api/HueBridgeConfig';
import {HueState} from '@/hue-api/HueState';

export default class HueBridge {
  // 'Discover' any bridges on the network and return a HueBridge instance for each found
  public static discover(): Promise<HueBridge[]> {
    return jsHue().discover()
      .then((response: any[]) => {
        const bridges: HueBridge[] = [];
        for (const bridge of response) {
          const hueBridge = new HueBridge(bridge.internalipaddress);
          hueBridge.id = bridge.id.toLowerCase();
          bridges.push(hueBridge);
        }

        return bridges;
      });
  }

  public internalipaddress: string;
  public id?: string; // Hue Bridge ID
  public username?: string; // Hue Username (optional until user operations are perfomed)

  private jsHueBridge: any;
  private jsHueBridgeUser: any;
  constructor(ip: string, username?: string) {
    this.internalipaddress = ip;
    this.username = username;

    this.jsHueBridge = jsHue().bridge(this.internalipaddress);
    if (this.username !== undefined) {
      this.setUsername(this.username);
    }
  }

  public createUser(appName: string): Promise<boolean> {
    // Attempt to create a user on the bridge
    return this.jsHueBridge.createUser(appName)
      .then((response: any) => {
        // Double check the create was successful
        if (response.length && response[0].success) {
          this.setUsername(response[0].success.username);

          // Now we have the username, force the load the Bridge ID (in case the bridge did not come from discover())
          return this.getConfig().then((config: HueBridgeConfig) => {
            this.id = config.bridgeid.toLowerCase();
            return true;
          });
        } else if (response.length && response[0].error) {
          throw new Error(response[0].error.description);
        } else {
          throw new Error('Unknown error occurred');
        }
      });
  }

  public getConfig(): Promise<HueBridgeConfig> {
    return this.jsHueBridgeUser.getConfig()
      .then((config: HueBridgeConfig) => {
        return config;
      });
  }

  public getGroups(): Promise<any> {
    return this.jsHueBridgeUser.getGroups()
      .then((response: any) => {
        if (response.length && response[0].error && parseInt(response[0].error.type, 10) === 1) {
          throw Error(response[0].error.description);
        }
        // The Hue API sometimes says that the group state is 'off' when there
        // is still a single light on. Fix that by overriding the 'on' action
        for (const groupId in response) {
          if (response.hasOwnProperty(groupId)) {
            response[groupId].action.on = response[groupId].state.any_on;
          }
        }
        return response;
      });
  }

  public getLights(): Promise<any> {
    return this.jsHueBridgeUser.getLights()
      .then((response: any) => {
        if (response.length && response[0].error && parseInt(response[0].error.type, 10) === 1) {
          throw Error(response[0].error.description);
        }

        return response;
      });
  }

  public setGroupState(groupId: string, state: HueState): Promise<any> {
    return this.jsHueBridgeUser.setGroupState(groupId, state);
  }

  public setLightState(lightId: string, state: HueState): Promise<any> {
    return this.jsHueBridgeUser.setLightState(lightId, state);
  }

  /**
   * Set the bridge username and instantiate the jsHue Bridge Object
   * @param username
   */
  private setUsername(username: string): void {
    this.username = username;
    this.jsHueBridgeUser = this.jsHueBridge.user(this.username);
  }
}
