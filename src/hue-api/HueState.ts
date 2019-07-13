/**
 * A 'State' that can represent a Light or GroupLight State
 */
export interface HueState {
  on?: boolean;
  bri?: number;
  hue?: number;
  sat?: number;
  xy?: number[];
  ct?: number;
  alert?: string;
  effect?: string;
  transitiontime?: number;
  colormode?: string;

  // groups/rooms //
  scene?: string;
}
