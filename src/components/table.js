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
    const sick = computed(() => store.state.content.form.sickImmunizer);
    const local = computed(() => store.state.content.form.local);
    const valueYears = computed(() => {
      const periodStart = store.state.content.form.periodStart;
      const periodEnd = store.state.content.form.periodEnd;
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


    const setTableData = async () => {
      if (!sick.value || (sick.value && !sick.value.length) || !local.value.length || !valueYears.value.length){
        loading.value = false;
        rows.value = [];
        return;
      }

      const currentResult = await store.dispatch("content/requestData", { detail: true });
      const tableData = formatToTable(currentResult.data, currentResult.localNames);
      columns.value = tableData.header;
      rows.value = tableData.rows;
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
