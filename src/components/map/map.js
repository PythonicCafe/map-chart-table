import { MapChart } from "../../map-chart";
import { ref, onMounted, watch, computed, nextTick } from "vue/dist/vue.esm-bundler";
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
            statesSelected: local
          }
        }

        renderMap(mapSetup);
      } catch (e) {
        renderMap({ element: mapElement, map: map.value });
      }
      loading.value = false;
    }

    const updateMap = async (local) => {
      if (local.length === 1) {
        map.value = await queryMap(local);
      } else {
        const mapElement = document.querySelector('#map');
        map.value = await queryMap("BR");
        renderMap({ element: mapElement, map: map.value });
      }
    }

    // Using debounce to load most recent setMap call
    // Fix url already setted values causing multiple setMap calls
    const debounce = createDebounce();

    onMounted(async () => {
      debounce(async () => {
        await updateMap(store.state.content.form.local);
        await setMap(), 200;
      });
    });

    watch(
      () => {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.dose, form.type, store.state.content.form.local, form.granularity, form.periodStart, form.periodEnd];
      },
      async () => {
        // Avoid render before change tab
        if (!Array.isArray(store.state.content.form.sickImmunizer)) {
          debounce(async () => {
            await setMap(), 200;
          });
        }
      }
    )

    watch(
      () => [store.state.content.form.local, store.state.content.form.granularity],
      async () => {
        loading.value = true;
        await updateMap(store.state.content.form.local);
        loading.value = false;
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
