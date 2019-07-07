export interface HueBridgeConfig {
  apiversion: string;
  bridgeid: string;
  datastoreversion: string;
  factorynew: boolean;
  mac: string;
  modelid: string;
  name: string;
  replacesbridgeid?: string|null;
  starterkitid: string;
  swversion: string;
}
