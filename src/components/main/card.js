import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NButton, NIcon, NModal, NSkeleton, NSpin } from 'naive-ui'
import { useContentStore, useMapStore } from '@/stores'

import { storeToRefs } from 'pinia'

import Chart from '@/components/main/card-components/chart'
import FilterSuggestion from '@/components/main/card-components/filter-suggestion'
import Map from '@/components/main/card-components/map'
import SubSelect from '@/components/main/card-components/sub-select'
import Table from '@/components/main/card-components/table'
import SubButtons from '@/components/main/card-components/sub-buttons'

export default defineComponent({
    components: {
        Chart,
        FilterSuggestion,
        Map,
        NButton,
        NCard,
        NIcon,
        NModal,
        NSkeleton,
        NSpin,
        SubButtons,
        SubSelect,
        Table,
    },
    props: { api: { type: String, required: true } },
    setup() {
        const isMobileScreen = ref(false)
        const showModal = ref(false)

        const getWindowWidth = () => {
            isMobileScreen.value = window.innerWidth <= 1368
        }
        window.addEventListener('resize', getWindowWidth)

        const storeContent = useContentStore()
        const { mainTitle, subTitle, loading, tab, selectsEmpty } =
            storeToRefs(storeContent)

        const storeMap = useMapStore()
        const { loadingMap } = storeToRefs(storeMap)

        onMounted(() => {
            getWindowWidth()
        })
        return {
            isMobileScreen,
            loading,
            loadingMap,
            mainTitle,
            selectsEmpty,
            showModal,
            subTitle,
            tab,
        }
    },
    template: `
    <section>
      <div>
        <template v-if="isMobileScreen">
          <div class="filter-mobile-button">
            <n-button
              type="primary"
              round
              @click="showModal = true"
              style="width: 240px; margin: 12px 0px;"
            >Filtrar
          </n-button>
          </div>
          <n-modal
            v-model:show="showModal"
            transform-origin="center"
            preset="card"
            style="width: 100%; min-height: 100vh"
          >
            <n-card
              :bordered="false"
              size="huge"
            >
              <SubSelect :isMobileScreen />
              <div class="filter-mobile-button">
                <n-button
                  type="primary"
                  round @click="showModal = false"
                  style="width: 240px; margin-top: 32px;"
                >Pronto
                </n-button>
              </div>
            </n-card>
          </n-modal>
        </template>
        <div class="sub-select-container" v-else>
          <SubSelect :isMobileScreen />
        </div>
      </div>
      <div class="main-content">
        <n-spin :show="loading || loadingMap">
          <!-- Titles section -->
          <section style="min-height: 4.8rem">
            <h2 v-if="mainTitle" class="main-title">{{ mainTitle }}</h2>
            <n-skeleton v-else height="2.3rem" width="60%" :animated="false" />
            <h3 v-if="subTitle" class="sub-title">{{ subTitle }}</h3>
            <n-skeleton v-else height="2rem" width="45%" :animated="false" style="margin-top: 4px" />
          </section>
          <div class="map-section">
            <template v-if="tab === 'map'">
              <Map ref="map" :api='api' />
            </template>
            <template v-if="tab === 'chart'">
              <Chart />
            </template>
            <template v-else-if="tab === 'table'">
              <Table />
            </template>
          </div>
          <FilterSuggestion v-if="selectsEmpty" />
        </n-spin>
      </div>
      <div class="main-content main-content--sub">
        <SubButtons />
      </div>
    </section>
    `,
})
