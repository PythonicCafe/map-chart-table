import ModalCaller from '@/components/main/modal/modal-caller'
import MainCard from '@/components/main/card'
import { biMap, biGraphUp, biTable } from '@/icons'
import { computed, defineComponent, onBeforeMount, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores/content'
import { useMessageStore } from '@/stores/message'
import {
    NButton,
    NEmpty,
    NIcon,
    NScrollbar,
    NSkeleton,
    NTab,
    NTabPane,
    NTabs,
    NTooltip,
    useMessage,
} from 'naive-ui'

export default defineComponent({
    components: {
        NTabs,
        NTabPane,
        NTab,
        NButton,
        NIcon,
        NScrollbar,
        NTooltip,
        NSkeleton,
        NEmpty,
        MainCard,
        ModalCaller,
    },
    props: { api: { type: String, required: true } },
    setup(props) {
        const messageNaive = useMessage()

        const storeMessage = useMessageStore()
        const { type, text, duration } = storeToRefs(storeMessage)

        const contentStore = useContentStore()

        const {
            apiUrl,
            disableChart,
            disableMap,
            tab,
            tabBy,
            yearSlideAnimation,
            form,
        } = storeToRefs(contentStore)

        const disableAll = computed(() => yearSlideAnimation.value)

        onBeforeMount(async () => {
            apiUrl.value = props.api
            contentStore.initial({ map: 'BR' })
            // Initialize filters, internal vars and modal contents
            await Promise.all([
                contentStore.requestJson('dose-blocks'),
                contentStore.requestJson('granularity-blocks'),
                contentStore.requestJson('link-csv'),
                contentStore.requestJson('mandatory-vaccinations-years'),
                contentStore.requestJson('lastupdatedate'),
                contentStore.requestJson('auto-filters'),
                contentStore.requestJson('acronyms'),
                contentStore.requestPage('slug=sobre-vacinas-vacinabr'),
            ])
        })

        onMounted(async () => {
            await contentStore.updateFormSelect()
            contentStore.setStateFromUrl()
        })

        // Update URL from state form and tabs changes
        watch(
            () => [
                form.value.dose,
                form.value.granularity,
                form.value.granularity,
                form.value.local,
                form.value.period,
                form.value.periodEnd,
                form.value.periodStart,
                form.value.sickImmunizer,
                form.value.type,
                form.value.city,
                tab.value,
                tabBy.value,
            ],
            () => {
                contentStore.setUrlFromState()
            }
        )

        // Show messages with useMessageStore state updates
        storeMessage.$subscribe(() => {
            if (text.value && type.value) {
                messageNaive.create(text.value, {
                    type: type.value,
                    duration: duration.value ?? 3000,
                })
            }
            // Empty message state
            storeMessage.clear()
        })

        return {
            tabBy,
            tab,
            disableAll,
            disableMap,
            disableChart,
            biMap,
            biGraphUp,
            biTable,
            contentStore,
        }
    },
    template: `
      <section class="main vbr">
        <div class="main-header">
          <div class="main-header-container">
            <div class="main-header-form">
              <label class="main-header__label">Pesquisar por:</label>
              <n-tabs type="segment" :value="tabBy" @update:value="(val) => contentStore.setFormField('tabBy', val)">
                <n-tab name="sicks" tab="Doença" :disabled="disableAll" />
                <n-tab name="immunizers" tab="Vacina" :disabled="disableAll" />
              </n-tabs>
            </div>
            <hr class="custom-hr">
            <div class="main-header-form">
              <label class="main-header__label">Visualizar por:</label>
              <n-tabs :value="tab" type="segment" @update:value="(val) => contentStore.setFormField('tab', val)">
                <n-tab name="map" :disabled="disableMap || disableAll">
                 <n-icon class="main-header__tab-icon" v-html="biMap" />
                 <span class="main-header__tab-label">Mapa</span>
                </n-tab>
                <n-tab name="chart" :disabled="disableChart || disableAll">
                 <n-icon class="main-header__tab-icon" v-html="biGraphUp" />
                 <span class="main-header__tab-label">Gráfico</span>
                </n-tab>
                <n-tab name="table" :disabled="disableAll">
                 <n-icon class="main-header__tab-icon" v-html="biTable" />
                 <span class="main-header__tab-label">Tabela</span>
                </n-tab>
              </n-tabs>
            </div>
          </div>
        </div>
        <MainCard :api="api" />
      </section>
      <ModalCaller />
    `,
})
