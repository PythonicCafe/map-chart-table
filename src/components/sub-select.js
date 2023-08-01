import { ref, watch, computed } from "vue/dist/vue.esm-bundler";
import { NSelect, NFormItem, NDatePicker, NButton } from "naive-ui";
import { useStore } from 'vuex';
import { computedVar } from "../utils";

export const subSelect = {
  components:  {
    NSelect,
    NFormItem,
    NDatePicker,
    NButton
  },
  setup () {
    const store = useStore();
    const tab = computed(() => store.state.tab);
    const tabBy = computed(() => store.state.tabBy);
    const sickTemp = ref(null);
    const localTemp = ref(null);
    const sick = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "sickImmunizer" }));
    const sicks = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "sicksImmunizers" }));
    const type = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "type" }));
    const types = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "types" }));
    const local = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "local" }));
    const locals = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "locals" }))
    const period = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "period" }));
    const granularity = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "granularity" }));
    const granularities = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "granularities" }));
    const periodStart = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "periodStart" }));
    const periodEnd = computed(computedVar({ store, base: "form", mutation: "UPDATE_FORM", field: "periodEnd" }))

    const showingLocalsOptions = ref(null);
    const showingSicksOptions = ref(null);

    const updateDatePosition = () => {
      const endDate = periodEnd.value
      const startDate = periodStart.value
      const tsEndDate = endDate ? new Date(endDate) : null
      const tsStartDate = startDate ? new Date(startDate) : null
      if (!tsStartDate || !tsEndDate) {
        return
      }
      if (tsStartDate > tsEndDate) {
        periodEnd.value = startDate
        periodStart.value = endDate
      }
    }

    const selectAllLocals = (options) => {
      const allOptions = options.map((option) => option.value)
      const selectLength = Array.isArray(localTemp.value) ? localTemp.value.length : null
      if (selectLength == allOptions.length) {
        localTemp.value = [];
        return;
      }

      localTemp.value = allOptions;
    }

    const handleLocalsUpdateShow = (show) => {
      showingLocalsOptions.value = show;

      if (!showingLocalsOptions.value && localTemp.value) {
        local.value = localTemp.value;
      }
    };

    const handleLocalsUpdateValue = (value) => {
      localTemp.value = value;
      if (!showingLocalsOptions.value && localTemp.value){
        local.value = localTemp.value;
      }
    };

    const handleSicksUpdateShow = (show) => {
      showingSicksOptions.value = show;

      if (!showingSicksOptions.value && sickTemp.value) {
        sick.value = sickTemp.value;
      }
    };

    const handleSicksUpdateValue = (value) => {
      sickTemp.value = value;

      if (!showingSicksOptions.value) {
        sick.value = value;
      }
    };

    const disablePreviousDate = (ts) => {
      const timestamp = Date.now()
      const dateNow = new Date(timestamp)
      const tsDate = new Date(ts)
      dateNow.setHours(23)
      dateNow.setMinutes(59)
      dateNow.setSeconds(59)
      return tsDate >= dateNow
    };

    watch(
      () => store.state.form.local,
      (loc) => {
        localTemp.value = loc
      }
    );

    watch(
      () => store.state.form.sickImmunizer,
      (sic) => {
        sickTemp.value = sic
      }
    );

    return {
      selectAllLocals,
      handleLocalsUpdateShow,
      handleLocalsUpdateValue,
      handleSicksUpdateShow,
      handleSicksUpdateValue,
      disablePreviousDate,
      type,
      types,
      local,
      locals,
      sick,
      sicks,
      periodStart,
      periodEnd,
      period,
      granularity,
      granularities,
      localTemp,
      sickTemp,
      updateDatePosition,
      tab,
      tabBy
    }
  },
  template: `
    <section style="display:flex; gap: 14px">
      <n-form-item :label="tabBy === 'sicks' ? 'Doença' : 'Imunizante'">
        <n-select
          v-model:value="sickTemp"
          :options="sicks"
          style="width: 200px"
          max-tag-count="responsive"
          :placeholder="'Selecione ' + (tabBy === 'sicks' ? 'doença' : 'imunizante')"
          :multiple="tab !== 'map'"
          :on-update:show="handleSicksUpdateShow"
          :on-update:value="handleSicksUpdateValue"
        />
      </n-form-item>
      <n-form-item label="Tipo de dado">
        <n-select
          v-model="type"
          :options="types"
          style="width: 200px"
          placeholder="Selecione Tipo de dado"
          multiple
          disabled
        />
      </n-form-item>
      <n-form-item label="Estados">
        <n-select
          v-model:value="localTemp"
          :options="locals"
          style="width: 200px"
          placeholder="Selecione Estado"
          multiple
          filterable
          max-tag-count="responsive"
          :on-update:show="handleLocalsUpdateShow"
          :on-update:value="handleLocalsUpdateValue"
        >
          <template #action>
            <n-button @click="selectAllLocals(locals)" tertiary>Selecionar todos</n-button>
          </template>
        </n-select>
      </n-form-item>
      <n-form-item label="Abrangência temporal" style="width: 200px">
        <n-date-picker
         class="start-datepicker"
         v-model:value="periodStart"
         type="year"
         placeholder="Início"
         :is-date-disabled="disablePreviousDate"
         @update:value="updateDatePosition"
         clearable
        />
        <n-date-picker
         class="end-datepicker"
         v-model:value="periodEnd"
         type="year"
         placeholder="Final"
         :is-date-disabled="disablePreviousDate"
         @update:value="updateDatePosition"
         clearable
        />
      </n-form-item>
      <n-form-item label="Granularidade">
        <n-select
          v-model:value="granularity"
          :options="granularities"
          style="width: 200px"
          placeholder="Selecione Granularidade"
          multiple
          disabled
        />
      </n-form-item>
    </section>
  `,
}
