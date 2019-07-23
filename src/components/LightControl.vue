<template>
  <div class="light-control" :class="{vertical: isVertical, horizontal: !isVertical}">
    <p class="title">{{title}}</p>
    <vue-slider v-model="data.bri"
                :direction="isVertical ? 'btt' : 'ltr'"
                :height="isVertical ? '400px' : null"
                :min="0"
                :max="254"
                :tooltipFormatter="tooltipFormatter"
                :processStyle="{
                backgroundImage: gradientString
              }"
                @change="onRangeInput"
    />

    <toggle-button :value="data.on"
                   color="#82C7EB"
                   :height="30"
                   v-on:change="handleToggleInput"
                   :sync="true"
                   :labels="false"
    />
    <div v-if="data.xy !== undefined"
         class="color-picker-toggle"
         v-on:click="showPickerOverlay">
      <v-icon name="palette" scale="2" />
    </div>

    <transition name="fade">
      <div class="color-picker-overlay"
           v-if="showColorPicker"
           v-on:click.self="hidePickerOverlay">
        <div class="inner">
          <IroColorPicker
                  :picker-options=colorPickerOptions
                  v-on:change="onColorChange" />
        </div>

      </div>
    </transition>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Watch, Vue} from 'vue-property-decorator';
  import {HueState} from '@/hue-api/HueState';
  import {cie_to_rgb, rgb_to_cie} from '@/hue-api/HueColorConversion';

  @Component
  export default class LightControl extends Vue {
    @Prop({default: {}})
    private state?: HueState;

    @Prop({default: ''})
    private title?: string;

    @Prop({default: false})
    private isVertical?: boolean;

    private showColorPicker: boolean = false;

    // Internal vals
    private data: HueState = {
      on: false,
      bri: 0,
      ct: 0,
      colormode: '',
      sat: 0,
    };

    private mounted(): void {
      this.propsToState();
    }

    @Watch('state')
    private onStateChanged() {
      this.propsToState();
    }

    get brightnessPercent(): number {
      if (this.data.bri) {
        return Math.round(this.data.bri / 254 * 100);
      }
      return 0;
    }

    get rgbValue(): number[] {
      if (this.data.xy && this.data.bri) {
        return cie_to_rgb(this.data.xy[0], this.data.xy[1], this.data.bri);
      }

      // Default to yellow-ish
      return [255, 207, 120];
    }

    get rgbString(): string {
      return `rgb(${this.rgbValue[0]},${this.rgbValue[1]},${this.rgbValue[2]})`;
    }

    get gradientString(): string {
      if (this.isVertical) {
        return `linear-gradient(${this.rgbString}, #CCC)`;
      }
      return `linear-gradient(to left, ${this.rgbString}, #CCC)`;

    }

    get colorPickerOptions(): any {
      return {
        color: this.rgbString,
        width: window.innerWidth > 500 ? 500 : window.innerWidth - 30,
        wheelDirection: 'clockwise',
        wheelAngle: -90,
      };
    }

    // Copy the props into our local data copy on load
    private propsToState(): void {
      if (this.state) {
        this.data = {
          on: this.state.on || false,
          bri: this.state.on ? (this.state.bri || 0) : 0,
          ct: this.state.ct || 0,
          colormode: this.state.colormode,
          sat: this.state.sat,
          hue: this.state.hue,
          xy: this.state.xy,
        };
      }
    }

    /**
     * Convert the slider val to a percentage of 254
     * @param sliderVal - Percentage formatted string
     */
    private tooltipFormatter(sliderVal: number): string {
      return this.brightnessPercent.toString() + '%';
    }

    // Handle the update of the On/Off toggle
    private handleToggleInput(event: any) {
      // Update the group and send back to the parent component
      const state: HueState = {
        on: event.value,
      };
      this.$emit('onstatechange', state);
    }

    // Handle the update of the Range Slider
    private onRangeInput(brightness: any): void {
      // Update the group and send back to the parent component
      const state: HueState = {
        bri: brightness,
        on: true,
      };
      this.$emit('onstatechange', state);
    }

    private onColorChange(color: number[]): void {
      const state: HueState = {
        xy: rgb_to_cie(color[0], color[1], color[2]),
      };
      this.$emit('onstatechange', state);
    }

    private showPickerOverlay(): void {
      this.showColorPicker = true;
    }

    private hidePickerOverlay(): void {
      this.showColorPicker = false;
    }
  }
</script>

<style lang="scss" scoped>
  .light-control {
    padding: 0 5px;

    &.horizontal {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      .title {
        flex: 1;
        order: 1;
        text-align: left;
      }
      .vue-js-switch {
        flex: 0;
        order: 3;
        padding-right: 0;
      }
      .vue-slider {
        width: 100% !important;
        order: 4;
      }
      .color-picker-toggle {
        flex: 0;
        order: 2;
      }
    }
  }
</style>
<style lang="scss">
  .vue-slider {

    border-radius: 40px;
    padding: 0 20px !important;
    background-color: #CCC;
    box-sizing: border-box;

    &.vue-slider-ltr {
      height: 40px !important;
    }
    &.vue-slider-btt {
      margin: 0 auto 10px auto;
      width: 40px !important;
      padding: 20px 0 !important;
      .vue-slider-rail {
        width: 40px;
      }
    }
  }
  .vue-slider-rail {
    border-radius: 40px;
  }
  .vue-slider-process {
    border-radius: 0;
    transition-property: height, bottom, background-color !important;
  }
  .vue-slider-dot {
    width: 40px !important;
    height: 40px !important;;
  }
  .light-control {
    .iro__colorPicker {
      margin: auto;
    }
    .iro__slider {
      display: none !important;
    }
  }

  .vue-js-switch {
    padding: 10px;
  }
  .color-picker-toggle {
    padding: 10px;
    cursor: pointer;
    transition: color 0.3s;
    &:hover {
      color: #999;
    }
  }
  .color-picker-overlay {
    position: fixed;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.4);
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;

    .inner {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      margin: auto;
      transform: translateY(-50%);
    }
  }
</style>
