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

      // Column value sort different based on type of data
      if (store.state.content.form.type === "Doses aplicadas") {
        columns.value[2].sorter = (a, b) => {
          return a.valor.replace(/[.]|,/g, "") - b.valor.replace(/[.]|,/g, "");
        };
      } else {
        columns.value[2].sorter = ((a, b) => {
          const nA = parseFloat(a.valor.replace("%", ""));
          const nB = parseFloat(b.valor.replace("%", ""));

          return nA - nB;
        });
      }
      loading.value = false;
    }

    onMounted(async () => await setTableData());

    watch(
      () =>  {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.dose, form.type, form.local, form.granularity, form.periodStart, form.periodEnd];
      },
      async () => {
        // Avoid render before change tab
        if (Array.isArray(store.state.content.form.sickImmunizer)) {
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
          description="Selecione valores para serem exibidos"
        />
      </div>
    </section>
  `
};
