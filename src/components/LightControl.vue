<template>
  <div class="light-control">
    <input type="checkbox"
           :checked="data.on"
           v-on:change="handleToggleInput"
    />

    <vue-slider v-model="data.bri"
                direction="btt"
                height="100%"
                :min="0"
                :max="254"
                :tooltipFormatter="tooltipFormatter"
                :processStyle="{
                  backgroundImage: gradientString
                }"
                @change="onRangeInput"
    />
    <IroColorPicker
        v-if="data.xy !== undefined"
        :picker-options="{
          color: rgbString,
          width: 150,
          wheelDirection: 'clockwise',
          wheelAngle: -90
        }"
        v-on:change="onColorChange" />
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
      return `linear-gradient(${this.rgbString}, #EEE)`;
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
    private handleToggleInput($event: any) {
      // Update the group and send back to the parent component
      const state: HueState = {
        on: $event.target.checked,
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
  }
</script>

<style lang="scss" scoped>
  .light-control {
    height: 400px;
    padding: 0 40px;
  }
</style>
<style lang="scss">
  .vue-slider {
    margin: 60px auto;
    width: 40px !important;
  }
  .vue-slider-rail {
    width: 40px;
    border-radius: 40px;
  }
  .vue-slider-process {
    border-radius: 40px;
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
</style>
