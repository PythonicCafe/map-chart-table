import { ref, computed } from "vue/dist/vue.esm-bundler";
import { NCard, NSlider, NSpace, NButton, NIconWrapper, NIcon } from "naive-ui";
import { useStore } from 'vuex'
import { computedVar } from "../../utils";
import { biCaretDown } from "../../icons.js";

export const yearSlider = {
  components:  {
    NCard,
    NSlider,
    NSpace,
    NButton,
    NIconWrapper,
    NIcon
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

    const valueMandatoryLabels = ref(null);
    const valueMandatory = computed(() => {
      const tabBy = store.state.content.tabBy;
      if (tabBy !== "immunizers") {
        return
      }

      const sickImmunizer = store.state.content.form.sickImmunizer;
      const dose = store.state.content.form.dose ? store.state.content.form.dose : "1ª dose";
      const mandatoryVaccineYears = store.state.content.mandatoryVaccineYears;

      if (mandatoryVaccineYears) {
        const result = mandatoryVaccineYears.find(el => el[0] === sickImmunizer && el[1] === dose);
        if (result) {
          valueMandatoryLabels.value = [result[2], result[3]];
          if (
            max.value && min.value &&
            (
              (max.value && max.value <= result[3]) ||
              (min.value && min.value >= result[2])
            )
          ) {
            return [result[2], result[3]];
          } else if (max.value && max.value <= result[3] && max.value >= result[2]) {
            return result[3];
          } else if (min.value && min.value >= result[2] && min.value <= result[3] ) {
            return result[2];
          }
        }
      }

      return
    });

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
      valueMandatory,
      showSlider,
      showTooltip,
      formatTooltip: (value) =>
        `Introdução no calendário de ${valueMandatoryLabels.value[0]} até ${valueMandatoryLabels.value[1]}`,
      playMap,
      mapPlaying,
      stopMap: () => {
        stopPlayMap.value = true
        showTooltip.value = false;
        mapPlaying.value = false;
      },
      period,
      biCaretDown
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
      <div style="width: 100%">
        <div style="display: flex">
          <span
            class="span-date"
            :class="valueMandatory ? 'span-date--more-padding' : ''"
          >{{ min }}</span>
          <div style="width:100%">
            <n-slider
              v-if="valueMandatory"
              class="mandatory-vaccine-years"
              v-model:value="valueMandatory"
              disable
              :min="min"
              :max="max"
              placement="top"
              disabled
              :range="max && min"
              :format-tooltip="formatTooltip"
            >
              <template #thumb>
                <n-icon-wrapper style="width: 15px; background-color: white; cursor: auto">
                  <n-icon v-html="biCaretDown" color="#32a1e6" size="12px" />
                </n-icon-wrapper>
              </template>
            </n-slider>
            <n-slider
              :disabled="!showSlider"
              :show-tooltip="showTooltip"
              v-model:value="period"
              :min="min"
              :max="max"
              :tooltip="showSlider"
              placement="bottom"
            >
              <template #thumb>
                <n-icon-wrapper :size="12" :border-radius="12" style="cursor: auto" />
              </template>
            </n-slider>
          </div>
          <span
            class="span-date"
            :class="valueMandatory ? 'span-date--more-padding' : ''"
          >{{ max }}</span>
        </div>
      </div>
    </section>
  `,
}
