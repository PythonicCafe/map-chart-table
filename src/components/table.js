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
    const loading = computed(computedVar({ store,  mutation: "content/UPDATE_LOADING", field: "loading" }));

    const setTableData = async () => {
      const currentResult = await store.dispatch("content/requestData", { detail: true });
      if (!currentResult || !currentResult.data ) {
        rows.value = [];
        return;
      }

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

      const coberturaCol = columns.value.findIndex(column => column.title === 'Cobertura')
      const populationCol = columns.value.findIndex(column => column.title === 'População')
      const dosesCol = columns.value.findIndex(column => column.title === 'Doses')
      const arraySortColumns = currentResult.metadata.type == "Meta atingida" ?
        [populationCol, dosesCol] : [coberturaCol, populationCol, dosesCol];
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
      rows,
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
        :pagination="{ pageSlot:7 }"
        :scrollbar-props="{ trigger: 'none', xScrollable: true }"
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
