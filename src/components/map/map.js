import { DataFetcher } from "../../data-fetcher";
import { MapChart } from "../../map-chart";
import { ref, onMounted, watch } from "vue/dist/vue.esm-bundler";
import { NSelect, NSpin, NButton, NFormItem } from "naive-ui";
import { useStore } from "vuex";

export const map = {
  components: {
    NSelect,
    NSpin,
    NButton,
    NFormItem,
  },
  props: {
    api: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const api = new DataFetcher(props.api);
    const loading = ref(true);
    const yearMapElement = ref(null);
    const mapChart = ref(null);
    const store = useStore();
    const datasetStates = ref(null);
    const datasetCities = ref(null);

    const queryMap = async (local) => {
      const file = await import(`../../assets/images/maps/${local}.svg`);
      const response = await fetch(file.default);
      return await response.text();
    };

    const renderMap = (args) => {
      if (!mapChart.value) {
        mapChart.value = new MapChart({
          ...args,
          tooltipAction: (opened, name) => {
            emit("mapTooltip", { opened, name });
          }
        });
      } else {
        mapChart.value.update({ ...args });
      }
      emit("mapChange", mapChart.value.datasetValues);
    }

    const requestApi = async (mapElement, map, request, local, period) => {
      try {
        datasetStates.value = await api.request(request);
        const states = await api.request("statesAcronym");
        renderMap({ element: mapElement, map, datasetStates: datasetStates.value[period], states, statesSelected: local });
      } catch (e) {
        renderMap({ element: mapElement, map });
      }
    }

    const setMap = async () => {
      const local = store.state.content.form.local;
      const sickImmunizer = store.state.content.form.sickImmunizer;
      const tab = store.state.content.tabBy;
      const period = store.state.content.form.period;
      const type = store.state.content.form.type;
      const doses = store.state.content.form.doses;
      const granularity = store.state.content.form.granularity;

      const mapElement = document.querySelector('#map');
      let request = "?tab=" + tab + "&sickImmunizer=" + sickImmunizer;
      if (!local.length || local.length > 1) {
        const map = await queryMap("BR");
        datasetCities.value = null;
        datasetStates.value = null;
        if (store.state.tabBy === "immunizer") {
          if (sickImmunizer && sickImmunizer.length && type && granularity && type && doses) {
            request += "&type=" + type + "&doses=" + doses;
            await requestApi(mapElement, map, request, local, period);
            return;
          }
        } else {
          if (sickImmunizer && sickImmunizer.length && type && granularity) {
            await requestApi(mapElement, map, request, local, period);
            return;
          }
        }

        renderMap({ element: mapElement, map });
        return;
      }

      const map = await queryMap(local);
      if (!sickImmunizer || !granularity) {
        return renderMap({ element: mapElement, map });
      }
      try {
        request += "&local=" + local;
        datasetCities.value = null;
        datasetStates.value = null;
        if (store.state.tabBy === "immunizer") {
          request += local + "&type=" + type + "&doses=" + doses;
          datasetCities.value = await api.requestState(request);
        } else {
          datasetCities.value = await api.requestState(request);
        }
        const cities = await api.request("?citiesAcronym=" + local);
        renderMap({ element: mapElement, map, datasetCities: datasetCities.value[period], cities });
      } catch (e) {
        renderMap({ element: mapElement, map });
      }
    }

    onMounted(async () => {
      loading.value = true;
      await setMap();
      loading.value = false;
    });

    watch(
      () => [
        store.state.content.form.local,
        store.state.content.form.sickImmunizer,
        store.state.content.form.type,
        store.state.content.form.granularity
      ],
      async () => {
        await setMap();
      }
    )

    watch(
      () => [store.state.content.form.period],
      async (period) => {
        if (datasetStates.value) {
          renderMap({ datasetCities: null, datasetStates: datasetStates.value[period] });
        } else if (datasetCities.value) {
          renderMap({ datasetStates: null, datasetCities: datasetCities.value[period] });
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
