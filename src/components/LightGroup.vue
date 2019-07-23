<template>
    <div class="light-group">
        <light-control
                :title="group.name"
                :state="group.action"
                v-if="!showLights"
                @onstatechange="onGroupChange"
        />

        <div class="single-lights"
             v-if="showLights">
            <div class="single-light"
                 :key="lightId"
                 v-for="(light, lightId) in lights">

                <light-control
                        :title="light.name"
                        :state="light.state"
                        @onstatechange="onLightChange(lightId, $event)"
                />
            </div>
        </div>

        <div class="light-toggle"
             v-if="group.lights.length > 1"
             v-on:click="toggleLights">
            <v-icon v-if="showLights" name="list-alt" scale="2" />
            <v-icon v-else name="regular/list-alt" scale="2" />
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {HueState} from '@/hue-api/HueState';

    @Component
    export default class LightGroup extends Vue {
        @Prop({default: {}})
        private group: any;

        @Prop({default: {}})
        private lights: any;

        private showLights: boolean = false;

        /**
         * INSTANCE METHODS
         */
        private onGroupChange(state: HueState): void {
            // Propagate the change up to the parent
            this.$emit('ongroupchange', state);
        }

        private onLightChange(lightId: number, state: HueState): void {
            // Propagate the change up to the parent
            this.$emit('onlightchange', lightId, state);
        }

        private toggleLights(): void {
            this.showLights = !this.showLights;
        }
    }
</script>

<style lang="scss" scoped>
    .light-toggle {
        margin-bottom: 10px;
        cursor: pointer;

        transition: color 0.3s;
        &:hover {
            color: #999;
        }
    }

    .single-lights {
        display: flex;
        justify-content: center;
    }
</style>
