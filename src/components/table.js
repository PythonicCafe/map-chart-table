import { ref, onMounted, computed, watch } from "vue/dist/vue.esm-bundler";
import { NButton, NDataTable, NSelect, NEmpty, NSpin } from "naive-ui";
import { timestampToYear, formatToTable } from "../utils";
import { useStore } from 'vuex';

export const table = {
  components: {
    NButton,
    NDataTable,
    NSelect,
    NEmpty,
    NSpin
  },
  props: {
    form: {
      type: Object,
    },
  },
  setup() {
    const store = useStore();
    const loading = ref(false);
    const rows =  ref([]);
    const columns = ref([]);

    const setTableData = async () => {
      const currentResult = await store.dispatch("content/requestData", { detail: true });
      if (!currentResult || !currentResult.data ) {
        rows.value = [];
        return;
      }

      const tableData = formatToTable(currentResult.data, currentResult.localNames, currentResult.metadata);
      columns.value = tableData.header;
      rows.value = tableData.rows;

      const arraySortColumns = currentResult.metadata.type == "Meta atingida" ? [4, 5] : [3, 4, 5];
      arraySortColumns.forEach(col => columns.value[col].sorter = sortNumericValue(columns.value[col]));
    }

    const sortNumericValue = (column) => (a, b) =>
       parseFloat(a[column.key].replace(/[%,.]/g, "")) - parseFloat(b[column.key].replace(/[%,.]/g, ""));

    onMounted(async () => {
      loading.value = true;
      await setTableData();
      loading.value = false;
    });

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
          loading.value = false;
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
      <n-spin
        :show="loading"
        v-else
      >
        <n-empty
          style="justify-content: center; border: 1px dashed gray; width: 100%; height: 557px; border-radius: .25rem"
          description="Selecione os filtros desejados para iniciar a visualização dos dados"
        />
      </n-spin>
    </section>
  `
};
