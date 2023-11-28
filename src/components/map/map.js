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
    const map = ref(null);
    const yearMapElement = ref(null);
    const mapChart = ref(null);
    const store = useStore();
    const datasetStates = ref(null);
    const datasetCities = ref(null);
    const granularity = computed(() => store.state.content.form.granularity);
    const formPopulated = computed(() => store.getters["content/selectsPopulated"]);

    const queryMap = async (local) => {
      let maplocal;

      if (granularity.value === "Macrorregião de saúde" && local.length > 1) {
        maplocal = "macreg/BR";
      } else if (granularity.value === "Macrorregião de saúde") {
        maplocal = `macreg/${local}`;
      } else if (granularity.value === "Região de saúde" && local.length > 1) {
        maplocal = `reg/BR`;
      } else if (granularity.value === "Região de saúde") {
        maplocal = `reg/${local}`;
      } else if (granularity.value === "Estados") {
        maplocal = "BR";
      } else {
        maplocal = local;
      }

      const file = await store.dispatch(`content/requestMap`, { map:maplocal });
      return file;
    }

    const renderMap = (args) => {
      const type = store.state.content.form.type;
      if (!mapChart.value) {
        mapChart.value = new MapChart({
          ...args,
          type,
          formPopulated: formPopulated.value,
          tooltipAction: (opened, name, id) => {
            emit("mapTooltip", { opened, name, id, type });
          }
        });
      } else {
        mapChart.value.update({ ...args, type, formPopulated: formPopulated.value });
      }
      emit("mapChange", mapChart.value.datasetValues);
    }

    const setMap = async () => {
      const local = store.state.content.form.local;
      if (!local) {
        return;
      }
      const mapElement = document.querySelector('#map');
      const period = store.state.content.form.period;
      datasetCities.value = null;
      datasetStates.value = null;

      loading.value = true;
      const results = await store.dispatch("content/requestData");
      try {
        let mapSetup = {
          element: mapElement,
          map: map.value
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
            statesSelected: local,
          }
        }

        renderMap(mapSetup);
      } catch (e) {
        renderMap({ element: mapElement, map: map.value });
      }
      loading.value = false;
    }

    const currentLocal = ref(null);

    const updateMap = async (local) => {
      const granularity = store.state.content.form.granularity;
      if (local.length === 1) {
        if (local+granularity !== currentLocal.value) {
          map.value = await queryMap(local);
        }
        currentLocal.value = local + granularity;
      } else if (local+granularity !== currentLocal.value) {
        const mapElement = document.querySelector('#map');
        map.value = await queryMap("BR");
        renderMap({ element: mapElement, map: map.value });
        currentLocal.value = "BR" + granularity;
      }
    }

    watch(
      () => {
        const form = store.state.content.form;
        return [
          form.sickImmunizer,
          form.dose,
          form.type,
          form.local,
          form.granularity,
          form.periodStart,
          form.periodEnd
        ];
      },
      async () => {
        // Avoid render before change tab
        if (!Array.isArray(store.state.content.form.sickImmunizer)) {
          await updateMap(store.state.content.form.local);
          await setMap();
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

    onMounted(async () => {
      // Avoiding wrong map loading
      setTimeout(async () => {
        // If map not setted by watcher
        if(!document.querySelector('#map').innerHTML) {
          await updateMap(store.state.content.form.local);
          await setMap();
        }
      }, 500);
    });

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
