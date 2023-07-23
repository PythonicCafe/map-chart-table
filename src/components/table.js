import { DataFetcher } from "../data-fetcher";
import { ref, onMounted, computed, watch } from "vue/dist/vue.esm-bundler";
import { NButton, NDataTable, NSelect, NEmpty } from "naive-ui";
import { timestampToYear } from "../utils";
import { useStore } from 'vuex';

export const table = {
  components: {
    NButton,
    NDataTable,
    NSelect,
    NEmpty
  },
  props: {
    api: {
      type: String,
      required: true
    },
    form: {
      type: Object,
    },
  },
  setup(props, { emit }) {
    const store = useStore();
    const loading = ref(true);
    const api = new DataFetcher(props.api);
    const rows =  ref([]);
    const columns = ref([]);
    const sick = computed(() => store.state.form.sick);
    const local = computed(() => store.state.form.local);
    const valueYears = computed(() => {
      const periodStart = store.state.form.periodStart;
      const periodEnd = store.state.form.periodEnd;
      if (!periodStart) {
        return [];
      }
      let y =  timestampToYear(periodStart);
      const result = [];
      while (y <= timestampToYear(periodEnd)) {
        result.push(y++);
      }
      return result;
    })

    onMounted(async () => {
      await setTableData();
    });

    const setTableData = async () => {
      if ((sick.value && !sick.value.length) || !local.value.length || !valueYears.value.length){
        loading.value = false;
        return;
      }
      const currentResult = await api.request(sick.value);

      columns.value = [];
      const tableData = convertObjectToArray(currentResult);
      for (const column of tableData[0]){
        columns.value.push(
          {
            title: column.charAt(0).toUpperCase() + column.slice(1),
            key: column,
            sorter: 'default',
            width: 200,
          }
        )
      }

      rows.value = [];
      for (let i = 1; i < tableData.length; i++) {
        const cells = {};
        for (let j = 0; j < tableData[i].length; j++) {
          cells[columns.value[j].key] = tableData[i][j];
        }
        rows.value.push(cells)
      }
      loading.value = false;
    }

    const convertObjectToArray = (obj) => {
      const result = [];
      let sicksNames = sick.value;
      let externalObj = obj;

      if (!externalObj[sicksNames[0]]) {
        externalObj = { [sicksNames[0]]: externalObj };
      }

      const locals = local.value;
      // Get the keys of the object and sort them in ascending order
      const years = valueYears.value;

      // Push the headers (year, acronym, value) to the result array
      result.push(['Ano', 'Sigla', 'Nome', 'Valor']);

      // Loop through each year
      for (const sickName of sicksNames) {
        for (const year of years) {
          // Loop through each state in the year
          for (const acronym of locals) {
            const value = externalObj[sickName][year] && externalObj[sickName][year][acronym] ? externalObj[sickName][year][acronym] : null;
            if (value){
              result.push([year, acronym, sickName, value + "%"]);
            }
          }
        }
      }

      return result;
    }

    watch(
      () => [
        store.state.form.local,
        store.state.form.sick,
        store.state.form.periodStart,
        store.state.form.periodEnd
      ],
      async () => {
        await setTableData();
      }
    )

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
        class="mct-canva"
      >
        <n-empty
          style="justify-content: center; border: 1px dashed gray; width: 100%; height: 100%; border-radius: .25rem"
          description="Selecione valores para serem exibidos"
        />
      </div>
    </section>
  `
};
