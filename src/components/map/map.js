import { MapChart } from "../../map-chart";
import { ref, onMounted, watch, computed } from "vue/dist/vue.esm-bundler";
import { NSelect, NSpin, NButton, NFormItem } from "naive-ui";
import { useStore } from "vuex";
import { convertArrayToObject, createDebounce } from "../../utils";

export const map = {
  components: {
    NSelect,
    NSpin,
    NButton,
    NFormItem,
  },
  setup(props, { emit }) {
    const loading = ref(true);
    const yearMapElement = ref(null);
    const mapChart = ref(null);
    const store = useStore();
    const datasetStates = ref(null);
    const datasetCities = ref(null);
    const granularity = computed(() => store.state.content.form.granularity);

    const queryMap = async (local) => {
      let map;

      if (granularity.value === "Macrorregião de saúde") {
        map = "reg/BR";
      } else if (Array.isArray(local) && local.length > 1) {
        map = "BR";
      } else {
        map = local;
      }

      const file = await store.dispatch(`content/requestMap`, { map });
      return file;
    }

    const renderMap = (args) => {
      const type = store.state.content.form.type;
      if (!mapChart.value) {
        mapChart.value = new MapChart({
          ...args,
          type,
          tooltipAction: (opened, name, id) => {
            emit("mapTooltip", { opened, name, id, type });
          }
        });
      } else {
        mapChart.value.update({ ...args, type });
      }
      emit("mapChange", mapChart.value.datasetValues);
    }

    const setMap = async () => {
      const mapElement = document.querySelector('#map');
      const local = store.state.content.form.local;
      const period = store.state.content.form.period;
      datasetCities.value = null;
      datasetStates.value = null;
      let map = await queryMap("BR");
      if (!local) {
        renderMap({ element: mapElement, map });
        return;
      } else if (local.length === 1) {
        map = await queryMap(local);
      }
      const results = await store.dispatch("content/requestData");
      try {
        let mapSetup = {
          element: mapElement,
          map
        };
        if (local.length === 1) {
          datasetCities.value = convertArrayToObject(results.data).data;
          datasetStates.value = null;
          mapSetup = {
            ...mapSetup,
            datasetCities: datasetCities.value[period],
            cities: results.localNames,
          }
        } else {
          datasetCities.value = null;
          datasetStates.value = convertArrayToObject(results.data).data;
          mapSetup = {
            ...mapSetup,
            datasetStates: datasetStates.value[period],
            states: results.localNames,
            statesSelected: local
          }
        }
        renderMap(mapSetup);
      } catch (e) {
        renderMap({ element: mapElement, map });
      }
    }

    // Using debounce to load most recent setMap call
    // Fix url already setted values causing multiple setMap calls
    const debounce = createDebounce();

    onMounted(async () => {
      loading.value = true;
      debounce(async () => await setMap(), 100);
      loading.value = false;
    });

    watch(
      () => {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.dose, form.type, form.local, form.granularity, form.periodStart, form.periodEnd];
      },
      async () => {
        // Avoid render before change tab
        if (!Array.isArray(store.state.content.form.sickImmunizer)) {
          debounce(async () => await setMap(), 100);
        }
      }
    )

    watch(
      () => [store.state.content.form.period],
      async (period) => {
        if (datasetStates.value) {
          renderMap({ datasetStates: datasetStates.value[period] });
        } else if (datasetCities.value) {
          renderMap({ datasetCities: datasetCities.value[period] });
        }
      }
    )

    return {
      loading,
      yearMapElement,
    };
  },
  template: `
    <section>
      <n-spin :show="loading" class="map-container">
        <div ref="map" id="map"></div>
        <div ref="yearMapElement" class="mct-canva-year"></div>
      </n-spin>
    </section>
  `
};
