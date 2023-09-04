import { ref, computed } from "vue/dist/vue.esm-bundler";
import { NCard, NSlider, NSpace, NButton, NIconWrapper } from "naive-ui";
import { timestampToYear } from "../../utils";
import { useStore } from 'vuex'
import { computedVar } from "../../utils";

export const yearSlider = {
  components:  {
    NCard,
    NSlider,
    NSpace,
    NButton,
    NIconWrapper
  },
  setup () {
    const store = useStore();
    const period = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM",  field: "period" }));
    const showSlider = ref(false);
    const showTooltip = ref(false);
    const mapPlaying = ref(false);
    const stopPlayMap = ref(false);
    const setSliderValue = (period) => {
      const form = store.state.content.form;
      showSlider.value = form.periodStart && form.periodEnd ? true : false;
      if (period) {
        return Number(period);
      }
      return;
    }

    const max = computed(() => setSliderValue(store.state.content.form.periodEnd));
    const min = computed(() => setSliderValue(store.state.content.form.periodStart));

    const years = computed(() => {
      let y = min.value;
      const result = [];
      while (y <= max.value) {
        result.push(y++);
      }
      return result;
    })

    const waitFor = (delay) => new Promise(resolve => setTimeout(resolve, delay));

    const playMap = async () => {
      showTooltip.value = true;
      mapPlaying.value = true;
      for (let year of years.value){
        if (stopPlayMap.value) {
          stopPlayMap.value = false;
          return;
        }
        period.value = year
        await waitFor(1000)
      }
      showTooltip.value = false;
      mapPlaying.value = false;
      stopPlayMap.value = false;
    }

    return {
      max,
      min,
      showSlider,
      showTooltip,
      playMap,
      mapPlaying,
      stopMap: () => {
        stopPlayMap.value = true
        showTooltip.value = false;
        mapPlaying.value = false;
      },
      period
    }
  },
  template: `
    <section
      class="year-slider"
    >
      <n-button
        v-if="!mapPlaying"
        type="primary"
        circle
        :disabled="!showSlider"
        @click="playMap"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            class="bi bi-play"
            viewBox="0 0 16 16"
          >
            <path
              d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"
            />
          </svg>
        </template>
      </n-button>
      <n-button
        v-else
        type="primary"
        circle
        @click="stopMap"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-stop"
            viewBox="0 0 16 16"
          >
            <path
              d="M3.5 5A1.5 1.5 0 0 1 5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5zM5 4.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5H5z"
            />
          </svg>
        </template>
      </n-button>
      <span style="white-space:nowrap; padding: 0px 6px; font-size: 14px">{{ min }}</span>
      <n-slider :disabled="!showSlider" :show-tooltip="showTooltip" v-model:value="period" :min="min" :max="max" :tooltip="showSlider">
        <template #thumb>
          <n-icon-wrapper :size="12" :border-radius="12" style="cursor: auto"></n-icon-wrapper>
        </template>
      </n-slider>
      <span style="white-space:nowrap; padding: 0px 6px; font-size: 14px">{{ max }}</span>
    </section>
  `,
}
