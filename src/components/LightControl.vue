<template>
  <div class="light-control">
    <input type="checkbox"
           :checked="data.on"
           v-on:change="handleToggleInput"
    />

    <vue-slider v-model="data.brightness"
                direction="btt"
                height="100%"
                :min="0"
                :max="254"
                :tooltipFormatter="tooltipFormatter"
                :processStyle="{backgroundColor: 'yellow', opacity: brightnessPercent / 100}"
                @change="onRangeInput"
    />
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Watch, Vue} from 'vue-property-decorator';
  import {HueState} from '@/hue-api/HueState';

  @Component
  export default class LightControl extends Vue {
    @Prop({default: {}})
    private state?: HueState;

    // Internal vals
    private data = {
      on: false,
      brightness: 0,
      ct: 0,
    };

    private mounted(): void {
      this.propsToState();
    }

    @Watch('state')
    private onStateChanged() {
      this.propsToState();
    }

    get brightnessPercent(): number {
      return Math.round(this.data.brightness / 254 * 100);
    }

    // Copy the props into our local data copy on load
    private propsToState(): void {
      if (this.state) {
        this.data = {
          on: this.state.on || false,
          brightness: this.state.on ? (this.state.bri || 0) : 0,
          ct: this.state.ct || 0,
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
      const state = {...this.state} || {};
      state.on = $event.target.checked;
      this.$emit('onstatechange', state);
    }

    // Handle the update of the Range Slider
    private onRangeInput(brightness: any): void {
      // Update the group and send back to the parent component
      const state = {...this.state} || {};
      state.bri = brightness;
      state.on = true;
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
    margin-top: 60px;
    width: 40px !important;
  }
  .vue-slider-rail {
    width: 40px;
    border-radius: 40px;
  }
  .vue-slider-process {
    border-radius: 40px;
  }
  .vue-slider-dot {
    width: 60px !important;
    height: 60px !important;;
  }
</style>
