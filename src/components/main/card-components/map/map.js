import { defineComponent, onMounted, watch } from 'vue'

import { NSpin } from 'naive-ui'

import { useMapStore, useContentStore } from '@/stores/index'
import { storeToRefs } from 'pinia'

export default defineComponent({
    components: { NSpin },
    setup() {
        const mapStore = useMapStore()
        const { mapElement } = storeToRefs(mapStore)
        const contentStore = useContentStore()
        const { form } = storeToRefs(contentStore)

        const updateSetMap = async () => {
            await mapStore.updateMap()
            await mapStore.setMapData()
        }

        onMounted(async () => {
            await updateSetMap()
        })
        watch(
            () => {
                return [
                    form.value.sickImmunizer,
                    form.value.dose,
                    form.value.type,
                    form.value.local,
                    form.value.granularity,
                    form.value.periodStart,
                    form.value.periodEnd,
                ]
            },
            async () => {
                await updateSetMap()
            }
        )

        watch(
            () => form.value.period,
            async (period) => {
                mapStore.updatePeriodManual(period)
            }
        )

        return { mapElement }
    },
    template: `
    <section>
      <div class="map-container" style="position: relative;">
        <div ref="mapElement" id="map"></div>
      </div>
    </section>
  `,
})
