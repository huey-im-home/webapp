<template>
  <div ref="colorPicker"></div>
</template>
<script lang="ts">
  import {Component, Prop, Watch, Vue} from 'vue-property-decorator';
  import iro from '@jaames/iro';
  @Component
  export default class IroColorPicker extends Vue {
    @Prop({default: {}})
    private pickerOptions?: any;

    private colorPicker: any;

    private isUserUpdating: boolean = false;

    private mounted() {
      this.colorPicker = new iro.ColorPicker(this.$refs.colorPicker, this.pickerOptions);

      this.colorPicker.on('color:change', (color: any) => {
        // Convert an RGB array, as thats what we use everywhere else
        const rgb = [
          color.rgb.r,
          color.rgb.g,
          color.rgb.b,
        ];
        this.$emit('change', rgb);
      });

      this.colorPicker.on('input:start', () => {
        this.isUserUpdating = true;
      });

      this.colorPicker.on('input:end', () => {
        this.isUserUpdating = false;
      });
    }

    @Watch('pickerOptions')
    private onPickerOptionsChanged() {
      // We need to prevent prop updates when the user is inputting otherwise the component will lock
      if (!this.isUserUpdating && this.pickerOptions.color) {
        // this.colorPicker.color.rgbString = this.pickerOptions.color;
      }
    }
  }
</script>
<style lang="scss" scoped>

</style>
