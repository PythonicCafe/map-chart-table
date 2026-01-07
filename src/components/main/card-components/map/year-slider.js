import { NCard, NSlider, NSpace, NButton, NIconWrapper, NIcon } from 'naive-ui'
import { defineComponent, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores/index'
import { biCaretDown } from '@/icons'

export default defineComponent({
    components: {
        NCard,
        NSlider,
        NSpace,
        NButton,
        NIconWrapper,
        NIcon,
    },
    setup() {
        const contentStore = useContentStore()
        const { form, tabBy, mandatoryVaccineYears, yearSlideAnimation } =
            storeToRefs(contentStore)

        const showSlider = ref(false)
        const showTooltip = ref(false)
        const stopPlayMap = ref(false)

        /**
         * @param {string | null} period
         */
        const setSliderValue = (period) => {
            showSlider.value =
                form.value.periodStart && form.value.periodEnd ? true : false
            if (period) {
                return Number(period)
            }
        }

        const max = computed(() => setSliderValue(form.value.periodEnd))
        const min = computed(() => setSliderValue(form.value.periodStart))

        /**
         * @type {import('vue').Ref<string[] | null>}
         */
        const valueMandatoryLabels = ref(null)

        const valueMandatory = computed(() => {
            if (tabBy.value !== 'immunizers') {
                return
            }

            const sickImmunizer = form.value.sickImmunizer
            const dose = form.value.dose ? form.value.dose : '1ª dose'

            if (mandatoryVaccineYears.value) {
                const result = mandatoryVaccineYears.value.find(
                    (/** @type{string[]} */ el) =>
                        el[0] === sickImmunizer &&
                        (el[1] === dose ||
                            (el[1] === 'Dose única' && dose === '1ª dose'))
                )
                if (result) {
                    valueMandatoryLabels.value = [result[2], result[3]]
                    if (
                        max.value &&
                        min.value &&
                        ((max.value && max.value <= result[3]) ||
                            (min.value && min.value >= result[2]))
                    ) {
                        return [result[2], result[3]]
                    } else if (
                        max.value &&
                        max.value <= result[3] &&
                        max.value >= result[2]
                    ) {
                        return result[3]
                    } else if (
                        min.value &&
                        min.value >= result[2] &&
                        min.value <= result[3]
                    ) {
                        return result[2]
                    }
                }
            }

            return
        })

        const years = computed(() => {
            let y = min.value
            const result = []

            if (y && max.value) {
                while (y <= max.value) {
                    result.push(y++)
                }
            }

            return result
        })

        const waitFor = (/** @type{number} */ delay) =>
            new Promise((resolve) => setTimeout(resolve, delay))

        const playMap = async () => {
            showTooltip.value = true
            yearSlideAnimation.value = true
            for (let year of years.value) {
                if (stopPlayMap.value) {
                    stopPlayMap.value = false
                    return
                }
                form.value.period = year
                await waitFor(1000)
            }
            showTooltip.value = false
            yearSlideAnimation.value = false
            stopPlayMap.value = false
        }

        /**
         * @param {string} key
         * @param {string} value
         * @returns void
         */
        const updateDate = (key, value) => {
            contentStore.setFormField(key, value)
        }
        return {
            max,
            min,
            valueMandatory,
            showSlider,
            showTooltip,
            formatTooltip: () => {
                if (valueMandatoryLabels.value && valueMandatoryLabels.value) {
                    return `Presente no calendário vacinal entre ${valueMandatoryLabels.value[0]} e ${valueMandatoryLabels.value[1]}`
                }
            },
            playMap,
            yearSlideAnimation,
            stopMap: () => {
                stopPlayMap.value = true
                showTooltip.value = false
                yearSlideAnimation.value = false
            },
            biCaretDown,
            updateDate,
            form,
        }
    },
    template: `
      <section
        class="year-slider"
      >
        <n-button
          v-if="!yearSlideAnimation"
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
                :range="!!max && !!min"
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
                :value="Number(form.period)"
                @update:value="(val) => updateDate('period', val)"
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
})
