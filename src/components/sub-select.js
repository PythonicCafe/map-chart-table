import { ref, watch, computed, toRaw, onBeforeMount, h } from "vue/dist/vue.esm-bundler";
import { NSelect, NFormItem, NDatePicker, NButton, NTooltip, NIcon } from "naive-ui";
import { useStore } from 'vuex';
import { computedVar } from "../utils";
import { biEraser } from "../icons.js";

export const subSelect = {
  components:  {
    NSelect,
    NFormItem,
    NDatePicker,
    NButton,
    NIcon
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
    const years = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "years" }))

    const showingLocalsOptions = ref(null);
    const showingSicksOptions = ref(null);

    const updateDatePosition = () => {
      const endDate = periodEnd.value
      const startDate = periodStart.value
      const tsEndDate = endDate
      const tsStartDate = startDate
      if (!tsStartDate || !tsEndDate) {
        return
      }
      if (tsStartDate > tsEndDate) {
        periodEnd.value = startDate
        periodStart.value = endDate
      }
    }

    const selectAllLocals = (options) => {
      const allOptions = toRaw(options).filter((option) => option.value !== "Todos")
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
      if (toRaw(value).includes("Todos")) {
        selectAllLocals(locals.value);
        return;
      }

      localTemp.value = value;
      if (!showingLocalsOptions.value && localTemp.value){
        local.value = localTemp.value;
      }
      const nPopover = document.querySelector(".n-popover");
      if (nPopover) {
       nPopover.innerHTML = "<!---->";
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
      const nPopover = document.querySelector(".n-popover");
      if (nPopover) {
       nPopover.innerHTML = "<!---->";
      }
    };

    const eraseForm = () => {
      store.commit("content/CLEAR_STATE");
    }

    const clear = (key) => {
      if (key === "sickImmunizer") {
        sickTemp.value = null;
        sick.value = null;
      } else if (key === "dose") {
        dose.value = null;
      } else if (key === "type") {
        type.value = null;
      }
    }

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

    return {
      selectAllLocals,
      handleLocalsUpdateShow,
      handleLocalsUpdateValue,
      handleSicksUpdateShow,
      handleSicksUpdateValue,
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
      years,
      granularity,
      granularities,
      localTemp,
      sickTemp,
      updateDatePosition,
      tab,
      tabBy,
      immunizers,
      biEraser,
      eraseForm,
      clear,
      modalContentGlossary: computed(() => {
        const text = store.state.content.about;
        let result = "";
        // TODO: Links inside text should be clickable
        for (let [key, val] of Object.entries(text)){
          let validUrl = null;
          let valFomated = val.replace(/\n/gi, "<br><br>");
          try {
            validUrl = new URL(val);
          }
          catch (e) {
            //Do nothing
          }
          if (validUrl) {
            valFomated = `<a href="${valFomated}" target="about:blank" style="color: #e96f5f">Acessar arquivo</a>`
          }
          result += `<h2 style="margin-bottom: 12px">${key}</h2><p>${valFomated}</p>`;
        }
        return result;
      }),
      renderOption: ({ node, option }) => {
        if (!option.disabled) {
          return node;
        }
        return h(NTooltip, {
          style: "",
          delay: 500
        }, {
          trigger: () => node,
          default: () => option.disabledText
        })
      },
    }
  },
  template: `
    <section class="mct-selects" :class="modal ? 'mct-selects--modal' : ''">
      <n-form-item :label="tabBy === 'sicks' ? 'Doença' : 'Vacina'">
        <n-select
          v-model:value="sickTemp"
          max-tag-count="responsive"
          class="mct-select"
          filterable
          :class="modal ? 'mct-select--modal' : ''"
          :consistent-menu-width="false"
          :multiple="tab !== 'map'"
          :on-update:show="handleSicksUpdateShow"
          :on-update:value="handleSicksUpdateValue"
          :options="tabBy === 'sicks' ? sicks : immunizers"
          :placeholder="'Selecione ' + (tabBy === 'sicks' ? 'Doença' : 'Vacina')"
          :render-option="renderOption"
          clearable
          :on-clear="() => clear('sickImmunizer')"
        />
      </n-form-item>
      <n-form-item label="Dose">
        <n-select
          v-model:value="dose"
          class="mct-select-dose"
          filterable
          max-tag-count="responsive"
          placeholder="Selecione dose"
          :options="doses"
          :class="modal ? 'mct-select-dose--modal' : ''"
          :render-option="renderOption"
          clearable
          :on-clear="() => clear('dose')"
        />
      </n-form-item>
      <n-form-item label="Tipo de dado">
        <n-select
          v-model:value="type"
          :consistent-menu-width="false"
          :options="types"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          max-tag-count="responsive"
          placeholder="Selecione Tipo de dado"
          filterable
          :render-option="renderOption"
          clearable
          :on-clear="() => clear('type')"
        />
      </n-form-item>
      <n-form-item label="Estados">
        <n-select
          v-model:value="localTemp"
          :options="locals"
          class="mct-select"
          style="width: 225px"
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
        <n-select
         class="start-datepicker"
         v-model:value="periodStart"
         :options="years"
         type="year"
         placeholder="Início"
         filterable
         @update:value="updateDatePosition"
         clearable
        />
        <n-select
         class="end-datepicker"
         v-model:value="periodEnd"
         :options="years"
         type="year"
         placeholder="Final"
         filterable
         @update:value="updateDatePosition"
         clearable
        />
      </n-form-item>
      <n-form-item label="Granularidade">
        <n-select
          v-model:value="granularity"
          :options="granularities"
          class="mct-select"
          :class="modal ? 'mct-select--modal' : ''"
          placeholder="Selecione Granularidade"
          clearable
          filterable
        />
      </n-form-item>
      <n-button title="Limpar todas as seleções" style="padding: 10px" @click="eraseForm">
        <template #icon><n-icon v-html="biEraser" /></template>
      </n-button>
    </section>
  `,
}
