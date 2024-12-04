import { ref, onMounted, computed, watch } from "vue/dist/vue.esm-bundler";
import { NButton, NDataTable, NSelect, NEmpty } from "naive-ui";
import { computedVar, formatToTable } from "../utils";
import { useStore } from 'vuex';

export const table = {
  components: {
    NButton,
    NDataTable,
    NSelect,
    NEmpty
  },
  props: {
    form: {
      type: Object,
    },
  },
  setup() {
    const store = useStore();
    const rows =  ref([]);
    const columns = ref([]);
    const page = ref(1);
    const pageCount = ref(0);
    const pageTotalItems = ref(10);
    const loading = computed(computedVar({ store,  mutation: "content/UPDATE_LOADING", field: "loading" }));
    const sorter = ref(null);

    const pagination = computed(() => ({
        page: page.value,
        pageCount: pageCount.value,
        pageSize: 10,
        pageSlot: 7,
        pageTotalItems: pageTotalItems.value,
        simple: true,
        prev: () =>  "🠐 anterior",
        next: () =>  "seguinte 🠒",
      }
    ));

    const setTableData = async () => {
      const currentResult = await store.dispatch("content/requestData", { detail: true, page: page.value, sorter: sorter.value });

      if (!currentResult || !currentResult.data ) {
        rows.value = [];
        return;
      }

      pageCount.value = Number(currentResult.metadata.pages.total_pages);
      pageTotalItems.value = currentResult.metadata.pages.total_records;

      const tableData = formatToTable(currentResult.data, currentResult.localNames, currentResult.metadata);
      columns.value = tableData.header;
      const dosesQtd = columns.value.findIndex(column => column.title === 'Doses (qtd)');
      if (currentResult.metadata.type == "Doses aplicadas") {
        columns.value.splice(dosesQtd, 1);
      } else {
        columns.value[dosesQtd].minWidth = "130px";
      }
      const columnValue = columns.value.find(column => column.key === "valor");
      columnValue.minWidth = "160px";
      columnValue.title = currentResult.metadata.type;
      rows.value = tableData.rows;
    }

    const updateTableContent = async () => {
      loading.value = true;
      await setTableData();
      loading.value = false;
    }

    onMounted(async () => {
      updateTableContent()
    });

    watch(
      () =>  {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.dose, form.type, form.local, form.granularity, form.periodStart, form.periodEnd];
      },
      async () => {
        // Avoid render before change tab
        if (Array.isArray(store.state.content.form.sickImmunizer)) {
          page.value = 1
          updateTableContent()
        }
      }
    );

    const handlePageChange = async (newPage) => {
      page.value = newPage
      updateTableContent()
    }

    const handleSorterChange = async (newSorter) => { // { columnKey: string; order: string }
      sorter.value = newSorter;
      if (!newSorter.order) {
        sorter.value = null;
      }
      updateTableContent();
    }

    return {
      columns,
      loading,
      rows,
      pagination,
      handlePageChange,
      handleSorterChange,
      formPopulated: computed(() => store.getters["content/selectsPopulated"])
    };
  },
  template: `
    <section>
      <n-data-table
        v-if="rows.length > 0"
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
          v-if="!loading.loading"
          style="justify-content: center; border: 1px dashed gray; width: 100%; height: 557px; border-radius: .25rem"
          :description="formPopulated ? 'Não existem dados para os filtros selecionados': 'Selecione os filtros desejados para iniciar a visualização dos dados'"
        />
        <div
          v-else
          style="justify-content: center; border: 1px dashed gray; width: 100%; height: 557px;"
        ></div>
      </section>
    </section>
  `
};
