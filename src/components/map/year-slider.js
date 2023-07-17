import { ref, computed } from "vue/dist/vue.esm-bundler";
import { NCard, NSlider, NSpace, NButton, NIconWrapper } from "naive-ui";
import { timestampToYear } from "../../utils";

export const yearSlider = {
  components:  {
    NCard,
    NSlider,
    NSpace,
    NButton,
    NIconWrapper
  },
  props: {
    form: {
      type: Object,
      required: true,
    }
  },
  setup (props) {
    const showSlider = ref(false);
    const showTooltip = ref(false);
    const mapPlaying = ref(false);
    const stopPlayMap = ref(false);
    const setSliderValue = (periods, i) => {
      if (Array.isArray(periods)) {
        if(periods[0] !== periods[1]) {
          showSlider.value = true;
        } else {
          showSlider.value = false;
        }
        return timestampToYear(periods[i])
      }
      showSlider.value = false;
      return 0;
    }

    const min = computed(
      () => {
        const result = setSliderValue(props.form.periods, 0);
        props.form.period = result;
        return result;
      }
    );
    const max = computed(
      () => setSliderValue(props.form.periods, 1)
    );

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
      for (let year of years.value) {
        if (stopPlayMap.value) {
          stopPlayMap.value = false;
          return;
        }
        props.form.period = year;
        await waitFor(1000)
      }
      showTooltip.value = false;
      mapPlaying.value = false;
      stopPlayMap.value = false;
    }

    return {
      value: ref(0),
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
      }
    }
  },
  template: `
    <section
      v-show="showSlider"
      class="year-slider"
    >
      <n-button
        v-if="!mapPlaying"
        type="primary"
        circle
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
      <n-slider :show-tooltip="showTooltip" v-model:value="form.period" :min="min" :max="max" :tooltip="true">
        <template #thumb>
          <n-icon-wrapper :size="12" :border-radius="12"></n-icon-wrapper>
        </template>
      </n-slider>
      <span style="white-space:nowrap; padding: 0px 6px; font-size: 14px">{{ max }}</span>
    </section>
  `,
}
