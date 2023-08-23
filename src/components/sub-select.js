import { ref, watch, computed, toRaw, onBeforeMount } from "vue/dist/vue.esm-bundler";
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
  props: {
    modal: {
      default: false,
      type: Boolean,
    },
  },
  setup () {
    const store = useStore();
    const tab = computed(() => store.state.content.tab);
    const tabBy = computed(() => store.state.content.tabBy);
    const sickTemp = ref(null);
    const localTemp = ref(null);
    const sick = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "sickImmunizer" }));
    const sicks = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "sicks" }));
    const immunizers = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "immunizers" }));
    const type = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "type" }));
    const types = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "types" }));
    const local = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "local" }));
    const locals = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "locals" }))
    const dose = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "dose" }));
    const doses = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "doses" }))
    const period = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "period" }));
    const granularity = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "granularity" }));
    const granularities = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "granularities" }));
    const periodStart = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "periodStart" }));
    const periodEnd = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "periodEnd" }))

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
      const allOptions = toRaw(options).filter((option) => option.value !== "Selecionar todos")
      const selectLength = Array.isArray(localTemp.value) ? localTemp.value.length : null
      if (selectLength == allOptions.length) {
        localTemp.value = [];
        return;
      }

      localTemp.value = allOptions.map(x => x.value);
    }

    const handleLocalsUpdateShow = (show) => {
      showingLocalsOptions.value = show;
      if (!showingLocalsOptions.value && localTemp.value) {
        local.value = localTemp.value;
      }
    };

    const handleLocalsUpdateValue = (value) => {
      if (toRaw(value).includes("Selecionar todos")) {
        selectAllLocals(locals.value);
        return;
      }

      localTemp.value = value;
      if (!showingLocalsOptions.value && localTemp.value){
        local.value = localTemp.value;
      }
    };

    const handleSicksUpdateShow = (show) => {
      showingSicksOptions.value = show;

      if (!showingSicksOptions.value && sickTemp.value && tab.value !== "map") {
        sick.value = sickTemp.value;
      }
    };

    const handleSicksUpdateValue = (value) => {
      sickTemp.value = value;
      if (!showingSicksOptions.value && sickTemp.value) {
        sick.value = value;
      }
    };

    const disableDate = (ts) => {
      const timestamp = Date.now()
      const dateNow = new Date(timestamp)
      dateNow.setHours(23)
      dateNow.setMinutes(59)
      dateNow.setSeconds(59)
      dateNow.setMilliseconds(1000)
      const tsDate = new Date(ts)
      let minYear = Math.min(...store.state.content.form.years.map(x => parseInt(Object.values(x)[0])));
      return dateNow.getFullYear() <= tsDate.getFullYear() || minYear > tsDate.getFullYear();
    };

    watch(
      () => store.state.content.form.local,
      (loc) => {
        localTemp.value = loc
      }
    );

    watch(
      () => store.state.content.form.sickImmunizer,
      (sic) => {
        sickTemp.value = sic
      }
    );

    onBeforeMount(() => {
        sickTemp.value = store.state.content.form.sickImmunizer;
        localTemp.value = store.state.content.form.local;
    });

    // TODO: Year selector should start from first selectable date
    return {
      selectAllLocals,
      handleLocalsUpdateShow,
      handleLocalsUpdateValue,
      handleSicksUpdateShow,
      handleSicksUpdateValue,
      disableDate,
      type,
      types,
      local,
      locals,
      dose,
      doses,
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
      tabBy,
      immunizers
    }
  },
  template: `
    <section class="mct-selects" :class="modal ? 'mct-selects--modal' : ''">
      <n-form-item :label="tabBy === 'sicks' ? 'Doença' : 'Imunizante'">
        <n-select
          v-model:value="sickTemp"
          :options="tabBy === 'sicks' ? sicks : immunizers"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          max-tag-count="responsive"
          :placeholder="'Selecione ' + (tabBy === 'sicks' ? 'Doença' : 'Imunizante')"
          :multiple="tab !== 'map'"
          :on-update:show="handleSicksUpdateShow"
          :on-update:value="handleSicksUpdateValue"
          filterable
        />
      </n-form-item>
      <template v-if="tabBy === 'immunizers'" >
        <n-form-item label="Dose">
          <n-select
            v-model:value="dose"
            :options="doses"
            class="mct-select-dose"
            :class="modal ? 'mct-select-dose--modal' : ''"
            max-tag-count="responsive"
            placeholder="Selecione dose"
            filterable
          />
        </n-form-item>
      </template>
      <n-form-item label="Tipo de dado">
        <n-select
          v-model:value="type"
          :options="types"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          max-tag-count="responsive"
          placeholder="Selecione Tipo de dado"
          filterable
        />
      </n-form-item>
      <n-form-item label="Estados">
        <n-select
          v-model:value="localTemp"
          :options="locals"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          placeholder="Selecione Estado"
          multiple
          filterable
          max-tag-count="responsive"
          :on-update:show="handleLocalsUpdateShow"
          :on-update:value="handleLocalsUpdateValue"
        >
        </n-select>
      </n-form-item>
      <n-form-item label="Abrangência temporal" style="width: 200px">
        <n-date-picker
         class="start-datepicker"
         v-model:value="periodStart"
         type="year"
         placeholder="Início"
         :is-date-disabled="disableDate"
         @update:value="updateDatePosition"
         clearable
         :actions="null"
        />
        <n-date-picker
         class="end-datepicker"
         v-model:value="periodEnd"
         type="year"
         placeholder="Final"
         :is-date-disabled="disableDate"
         @update:value="updateDatePosition"
         clearable
         :actions="null"
        />
      </n-form-item>
      <n-form-item label="Granularidade">
        <n-select
          v-model:value="granularity"
          :options="granularities"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          placeholder="Selecione Granularidade"
          filterable
        />
      </n-form-item>
    </section>
  `,
}
