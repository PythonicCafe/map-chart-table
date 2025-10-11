import { ref, watch, computed, toRaw, onBeforeMount, onMounted, h, reactive, nextTick } from "vue/dist/vue.esm-bundler";
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
  setup (props) {
    const store = useStore();
    const tab = computed(() => store.state.content.tab);
    const tabBy = computed(() => store.state.content.tabBy);
    const sickTemp = ref(null);
    const localTemp = ref(null);
    const citiesTemp = ref([]);
    const disableLocalSelect = computed(() => store.getters[`content/disableLocalSelect`]);
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
    const city = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "city" }))
    const cities = computed(computedVar({ store, base: "form", mutation: "content/UPDATE_FORM", field: "cities" }))
    const selectRefsMap = reactive({});
    const resizeObserver = ref(null);

    const activeSelectKey = ref(null);
    const formRef = ref(null);

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

    const styleWidth = props.modal ? "width: 400px;"  : "width: 200px;";

    watch(
      () => props.modal,
      () => {
        const loc = store.state.content.form.local;
        if (loc) {
          citiesTemp.value = cities.value.filter(city => loc.includes(city.uf));
        }
      },
      { deep: true, immediate: true }
    )

    watch(
      () => store.state.content.form.local,
      (loc) => {
        if (!loc.length) {
          city.value = [];
        } else {
          citiesTemp.value = cities.value.filter(city => loc.includes(city.uf));
          if (city.value?.length) {
            city.value = city.value.filter(itemA => citiesTemp.value.find(itemB => itemB.value === itemA));
          }
        }
        localTemp.value = loc;
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

    const handleShowUpdate = (show, key) => {
      if (show) {
        activeSelectKey.value = key;
      } else if (activeSelectKey.value === key) {
        activeSelectKey.value = null;
      }
    };

    const updateDropdownPosition = () => {
      const key = activeSelectKey.value;

      if (key && selectRefsMap[key]) {
        const activeSelect = selectRefsMap[key];
        activeSelect.blur();
        nextTick(() => {
          activeSelect.handleTriggerClick();
        });
      }
    };

    onMounted(() => {
      if (formRef.value) {
        resizeObserver.value = new ResizeObserver(updateDropdownPosition);
        resizeObserver.value.observe(formRef.value.closest('.main'));
      }
    });

    return {
      biEraser,
      cities,
      citiesTemp,
      city,
      clear,
      disableAll: computed(() => store.state.content.yearSlideAnimation),
      disableLocalSelect,
      dose,
      doses,
      eraseForm,
      formRef,
      granularities,
      granularity,
      handleLocalsUpdateShow,
      handleLocalsUpdateValue,
      handleShowUpdate,
      handleSicksUpdateShow,
      handleSicksUpdateValue,
      immunizers,
      local,
      localTemp,
      locals,
      period,
      periodEnd,
      periodStart,
      selectAllLocals,
      selectRefsMap,
      sick,
      sickTemp,
      sicks,
      styleWidth,
      tab,
      tabBy,
      type,
      types,
      updateDatePosition,
      years,
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
    <section ref="formRef" class="mct-selects" :class="modal ? 'mct-selects--modal' : ''">
      <n-form-item :label="tabBy === 'sicks' ? 'Doença' : 'Vacina'">
        <n-select
          :ref="el => (selectRefsMap['field1'] = el)"
          v-model:value="sickTemp"
          max-tag-count="responsive"
          class="mct-select"
          filterable
          :style="styleWidth"
          :consistent-menu-width="false"
          :multiple="tab !== 'map'"
          :on-update:show="handleSicksUpdateShow"
          :on-update:value="handleSicksUpdateValue"
          :options="tabBy === 'sicks' ? sicks : immunizers"
          :placeholder="'Selecione ' + (tabBy === 'sicks' ? 'Doença' : 'Vacina')"
          :render-option="renderOption"
          clearable
          :disabled="disableAll"
          :on-clear="() => clear('sickImmunizer')"
          @update:show="show => handleShowUpdate(show, 'field1')"
        />
      </n-form-item>
      <n-form-item label="Dose">
        <n-select
          :ref="el => (selectRefsMap['field2'] = el)"
          v-model:value="dose"
          class="mct-select-dose"
          filterable
          max-tag-count="responsive"
          placeholder="Selecione dose"
          :options="doses"
          :style="styleWidth"
          :render-option="renderOption"
          clearable
          :disabled="disableAll"
          :on-clear="() => clear('dose')"
          @update:show="show => handleShowUpdate(show, 'field2')"
        />
      </n-form-item>
      <n-form-item label="Tipo de dado">
        <n-select
          :ref="el => (selectRefsMap['field3'] = el)"
          v-model:value="type"
          :consistent-menu-width="false"
          :options="types"
          class="mct-select"
          :style="styleWidth"
          max-tag-count="responsive"
          placeholder="Selecione Tipo de dado"
          filterable
          :render-option="renderOption"
          clearable
          :disabled="disableAll"
          :on-clear="() => clear('type')"
          @update:show="show => handleShowUpdate(show, 'field3')"
        />
      </n-form-item>
      <n-form-item label="Estados">
        <n-select
          :ref="el => (selectRefsMap['field4'] = el)"
          v-model:value="localTemp"
          :options="locals"
          class="mct-select"
          :style="styleWidth"
          placeholder="Selecione Estado"
          multiple
          filterable
          :disabled="disableAll || disableLocalSelect"
          max-tag-count="responsive"
          :on-update:show="handleLocalsUpdateShow"
          :on-update:value="handleLocalsUpdateValue"
          @update:show="show => handleShowUpdate(show, 'field4')"
        >
        </n-select>
      </n-form-item>
      <n-form-item label="Abrangência temporal" :style="modal ? 'max-width: 400px;' : 'max-width: 200px;'">
        <n-select
         :ref="el => (selectRefsMap['field5'] = el)"
         class="start-datepicker"
         v-model:value="periodStart"
         :options="years"
         type="year"
         placeholder="Início"
         filterable
         @update:value="updateDatePosition"
         clearable
         :disabled="disableAll"
         @update:show="show => handleShowUpdate(show, 'field5')"
        />
        <n-select
         :ref="el => (selectRefsMap['field6'] = el)"
         class="end-datepicker"
         v-model:value="periodEnd"
         :options="years"
         type="year"
         placeholder="Final"
         filterable
         @update:value="updateDatePosition"
         clearable
         :disabled="disableAll"
         @update:show="show => handleShowUpdate(show, 'field6')"
        />
      </n-form-item>
      <section>
        <n-form-item label="Granularidade">
          <n-select
            :ref="el => (selectRefsMap['field7'] = el)"
            v-model:value="granularity"
            :options="granularities"
            class="mct-select"
            :style="styleWidth"
            placeholder="Selecione Granularidade"
            clearable
            filterable
            :render-option="renderOption"
            :disabled="disableAll"
            @update:show="show => handleShowUpdate(show, 'field7')"
          />
        </n-form-item>
        <n-form-item label="Município" v-if="granularity === 'Municípios' && localTemp.length">
          <n-select
            :consistent-menu-width="false"
            :disabled="disableAll"
            :options="citiesTemp"
            :ref="el => (selectRefsMap['field8'] = el)"
            :style="styleWidth"
            @update:show="show => handleShowUpdate(show, 'field8')"
            class="mct-select"
            clearable
            filterable
            max-tag-count="responsive"
            placeholder="Selecione Município"
            v-model:value="city"
            :multiple="true"
          />
        </n-form-item>
      </section>
      <n-form-item>
        <n-button title="Limpar todas as seleções" style="padding: 10px" @click="eraseForm" :disabled="disableAll">
          <template #icon><n-icon v-html="biEraser" /></template>
        </n-button>
      </n-form-item>
    </section>
  `,
}
