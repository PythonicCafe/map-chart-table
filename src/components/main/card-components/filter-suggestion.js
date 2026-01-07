import { NButton } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useContentStore, useModalStore } from '@/stores'
import { defineComponent, computed } from 'vue'

export default defineComponent({
    components: {
        NButton,
    },
    setup() {
        const contentStore = useContentStore()
        const { autoFilters, extraFilterButton } = storeToRefs(contentStore)

        const modalStore = useModalStore()
        const {
            genericModal,
            genericModalShow,
            genericModalTitle,
            genericModalLoading,
        } = storeToRefs(modalStore)

        /**
         * @param {string[]} array
         */
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[array[i], array[j]] = [array[j], array[i]]
            }
            return array
        }

        /**
         * @param {any} element
         */
        const selectFilter = (element) => {
            Object.entries(element).forEach(
                (/** @type{string[]} element */ [key, value]) => {
                    if (key === 'tab') {
                        contentStore.setTabField(value)
                    } else if (key === 'tabBy') {
                        contentStore.setTabByField(value)
                    } else if (key === 'filters') {
                        Object.entries(value).forEach(
                            (/** @type{string[]} element */ [fKey, fValue]) => {
                                contentStore.setFormField(fKey, fValue)
                            }
                        )
                    }
                }
            )
        }

        const elements = computed(() => {
            const result = autoFilters.value
            return result ? shuffle(result).slice(-4) : null
        })

        /**
         * @param {string} title
         * @param {string} slug
         */
        const handleExtraButton = async (title, slug) => {
            genericModalLoading.value = true
            genericModal.value = null
            genericModalShow.value = !genericModalShow.value
            genericModalTitle.value = title
            try {
                await modalStore.requestContent(slug)
            } catch {
                // Do Nothing
            }
            genericModalLoading.value = false
        }

        return {
            elements,
            selectFilter,
            extraFilterButton,
            handleExtraButton,
        }
    },
    template: `
    <div v-if="elements" class="filter-suggestion" :class="extraFilterButton ? '' : 'filter-suggestion-center'">
      <div v-if="extraFilterButton" style="display: flex; justify-content: center; margin-top: 48px; margin-bottom: 64px;">
        <n-button
          type="success"
          class="pulse-button"
          size="large"
          style="height: 36.5167px"
          round
          @click="handleExtraButton(extraFilterButton.title, extraFilterButton.slug)"
        >{{ extraFilterButton.title }}</n-button>
      </div>
      <div>
        <div>
          <h2 class="filter-suggestion-title">
            Explore a plataforma usando os filtros acima, ou selecione um dos exemplos abaixo
          </h2>
        </div>
        <div class="filters-container">
          <n-button
            v-for="element in elements"
            style="display: flex; justify-content: initial; height: 80px;"
            @click="selectFilter(element)"
          >
            <div class="filter-container-suggestion">
              <div class="filter-text-suggestion filter-title">
               {{ element.title }}
              </div>
              <div class="filter-text-suggestion filter-description">{{ element.description }}</div>
            </div>
          </n-button>
        </div>
      </div>
    </div>
  `,
})
