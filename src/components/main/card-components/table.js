import {
    defineComponent,
    computed,
    onBeforeMount,
    onUnmounted,
    watch,
} from 'vue'

import { NButton, NDataTable, NEmpty, NSelect } from 'naive-ui'

import { storeToRefs } from 'pinia'
import { useContentStore, useTableStore } from '@/stores'

export default defineComponent({
    components: {
        NButton,
        NDataTable,
        NEmpty,
        NSelect,
    },
    setup() {
        const contentStore = useContentStore()
        const { form, loading } = storeToRefs(contentStore)

        const formPopulated = computed(() => contentStore.selectsPopulated)

        const tableStore = useTableStore()
        const { columns, page, pageCount, pageTotalItems, rows, sorter } =
            storeToRefs(tableStore)

        const pagination = computed(() => ({
            page: page.value,
            pageCount: pageCount.value,
            pageSize: 10,
            pageSlot: 7,
            pageTotalItems: pageTotalItems.value,
            simple: true,
            prev: () => '🠐 anterior',
            next: () => 'seguinte 🠒',
        }))

        onBeforeMount(() => {
            tableStore.setTableData()
        })

        onUnmounted(() => {
            tableStore.resetState()
        })

        watch(
            () => form.value,
            async () => {
                // Avoid render before change tab
                if (Array.isArray(form.value.sickImmunizer)) {
                    page.value = 1
                    await tableStore.setTableData()
                }
            },
            { deep: true }
        )

        /**
         * @param {number} newPage
         */
        const handlePageChange = async (newPage) => {
            page.value = newPage
            await tableStore.setTableData()
        }

        /**
         * @param {{ columnKey: string; order: string }} newSorter
         */
        const handleSorterChange = async (newSorter) => {
            sorter.value = newSorter
            if (!newSorter.order) {
                sorter.value = undefined
            }
            await tableStore.setTableData()
        }

        return {
            columns,
            loading,
            pagination,
            rows,
            handlePageChange,
            handleSorterChange,
            formPopulated,
        }
    },
    template: `
      <section>
        <n-data-table
          v-if="rows && rows.length"
          striped
          class="table-custom"
          :columns="columns"
          :data="rows"
          :bordered="false"
          :pagination="pagination"
          :remote="true"
          :scrollbar-props="{ trigger: 'none', xScrollable: true }"
          @update:page="handlePageChange"
          @update:sorter="handleSorterChange"
        />
        <section v-else>
          <n-empty
            v-if="!loading"
            style="justify-content: center; border: 1px solid #ccc; width: 100%; height: 557px; border-radius: .25rem"
            :description="formPopulated ? 'Não existem dados para os filtros selecionados': 'Selecione os filtros desejados para iniciar a visualização dos dados'"
          />
          <div
            v-else
            style="justify-content: center; border: 1px solid #ccc; width: 100%; height: 557px;"
          ></div>
        </section>
      </section>
    `,
})
