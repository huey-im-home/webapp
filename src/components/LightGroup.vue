<template>
    <div class="light-group" :class="{vertical: isVertical, horizontal: !isVertical}">
        <light-control
                :title="group.name"
                :state="group.action"
                :is-vertical="isVertical"
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
                        :is-vertical="isVertical"
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

        @Prop({default: false})
        private isVertical?: boolean;

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

    .light-group.horizontal {
        display: flex;
        .single-light {
            margin-bottom: 10px;
        }
        .light-toggle {
            flex: 0;
            order: 0;
            margin-bottom: 0;
            margin-right: 10px;
            margin-top: 60px;
            height: 40px;
        }

        .single-lights,
        .light-control {
            flex: 1;
            order: 1;
        }
    }

    .light-group.vertical {
        .single-lights {
            display: flex;
            justify-content: center;
        }
    }

</style>
