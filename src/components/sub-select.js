import { ref } from "vue/dist/vue.esm-bundler";
import { NSelect, NFormItem, NDatePicker, NButton } from "naive-ui";

export const subSelect = {
  props: {
    api: {
      type: String,
      required: true
    },
    tab: {
      type: String,
      required: true
    },
    tabBy: {
      type: String,
      required: true
    },
    form: {
      type: Object,
      required: true,
    }
  },
  components:  {
    NSelect,
    NFormItem,
    NDatePicker,
    NButton
  },
  setup (props, { emit }) {
    const local = ref(null);
    const showingLocalsOptions = ref(null);
    const selectAll = (options) => {
      const allOptions = options.map((option) => option.value)
      const selectLength = Array.isArray(local.value) ? local.value.length : null
      if (selectLength == allOptions.length) {
        local.value = [];
        return;
      }

      local.value = allOptions;
    }

    const handleLocalsUpdateShow = (show) => {
      showingLocalsOptions.value = show;

      if (!showingLocalsOptions.value && local.value){
        emit('update:form', {
          ...props.form,
          local: local.value
        });
      }
    };
    const handleLocalsUpdateValue = (value) => {
      local.value = value;
      if (!showingLocalsOptions.value){
        emit('update:form', {
          ...props.form,
          local: local.value
        });
      }
    };

    return {
      selectAll,
      local,
      handleLocalsUpdateShow,
      handleLocalsUpdateValue,
    }
  },
  template: `
    <section style="display:flex; gap: 14px">
      <n-form-item label="Doença">
        <n-select
          v-model:value="form.sick"
          :options="form.sicks"
          style="width: 200px"
          max-tag-count="responsive"
          placeholder="Selecione doença"
          :multiple="tab !== 'map'"
        />
      </n-form-item>
      <n-form-item label="Tipo de dado">
        <n-select
          v-model:value="form.type"
          :options="form.types"
          style="width: 200px"
          placeholder="Selecione Tipo de dado"
          multiple
          disabled
        />
      </n-form-item>
      <n-form-item label="Estados">
        <n-select
          v-model:value="local"
          :options="form.locals"
          style="width: 200px"
          placeholder="Selecione Estado"
          multiple
          filterable
          max-tag-count="responsive"
          :on-update:show="handleLocalsUpdateShow"
          :on-update:value="handleLocalsUpdateValue"
        >
          <template #action>
            <n-button @click="selectAll(form.locals, 'local')" tertiary>Selecionar todos</n-button>
          </template>
        </n-select>
      </n-form-item>
      <n-form-item label="Abrangência temporal" style="width: 200px">
        <n-date-picker
         :update-value-on-close="true"
         v-model:value="form.periods"
         type="yearrange"
         start-placeholder="Início"
         end-placeholder="Final"
         clearable
        />
      </n-form-item>
      <n-form-item label="Granularidade">
        <n-select
          v-model:value="form.granurality"
          :options="form.granuralities"
          style="width: 200px"
          placeholder="Selecione Granularidade"
          multiple
          disabled
        />
      </n-form-item>
    </section>
  `,
}
