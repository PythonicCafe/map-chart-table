import { ref, onMounted, computed, watch } from "vue/dist/vue.esm-bundler";
import { NButton, NDataTable, NSelect, NEmpty } from "naive-ui";
import { timestampToYear, formatToTable } from "../utils";
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
    const loading = ref(true);
    const rows =  ref([]);
    const columns = ref([]);

    const setTableData = async () => {

      const currentResult = await store.dispatch("content/requestData", { detail: true });
      if (!currentResult || !currentResult.data ) {
        rows.value = [];
        return;
      }
      const tableData = formatToTable(currentResult.data, currentResult.localNames);
      columns.value = tableData.header;
      rows.value = tableData.rows;

      [2, 3, 4].forEach(col => columns.value[col].sorter = sortNumericValue(columns.value[col]));
      loading.value = false;
    }

    const sortNumericValue = (column) => (a, b) =>
       parseFloat(a[column.key].replace(/[%,.]/g, "")) - parseFloat(b[column.key].replace(/[%,.]/g, ""));

    onMounted(async () => await setTableData());

    watch(
      () =>  {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.dose, form.type, form.local, form.granularity, form.periodStart, form.periodEnd];
      },
      async () => {
        // Avoid render before change tab
        if (Array.isArray(store.state.content.form.sickImmunizer)) {
          loading.value = true;
          await setTableData();
        }
      }
    );

    return {
      columns,
      loading,
      rows
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
        :loading="loading"
        :pagination="{ pageSlot:7 }"
        :scrollbar-props="{ trigger: 'none', xScrollable: true }"
      />
      <div
        v-else
      >
        <n-empty
          style="justify-content: center; border: 1px dashed gray; width: 100%; height: 557px; border-radius: .25rem"
          description="Selecione os filtros desejados para iniciar a visualização dos dados"
        />
      </div>
    </section>
  `
};
