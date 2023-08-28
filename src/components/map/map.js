import { DataFetcher } from "../../data-fetcher";
import { MapChart } from "../../map-chart";
import { ref, onMounted, watch } from "vue/dist/vue.esm-bundler";
import { NSelect, NSpin, NButton, NFormItem } from "naive-ui";
import { useStore } from "vuex";
import { formatDate } from "../../utils";

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
        datasetStates.value = await api.requestQs(request);
        const states = await api.request("statesNames");
        renderMap({ element: mapElement, map, datasetStates: datasetStates.value[period], states, statesSelected: local });
      } catch (e) {
        renderMap({ element: mapElement, map });
      }
    }

    const convertArrayToObject = (inputArray) => {
      const result = {};

      // Loop through the input array starting from the second element
      for (let i = 1; i < inputArray.length; i++) {
        const [year, local, value] = inputArray[i];
        if (!result[year]) {
          result[year] = {};
        }
        result[year][local] = value;
      }

      return result;
    }

    const setMap = async () => {
      const local = store.state.content.form.local;
      const sickImmunizer = store.state.content.form.sickImmunizer;
      const tabBy = store.state.content.tabBy;
      const period = store.state.content.form.period;
      const periodStart = formatDate(store.state.content.form.periodStart);
      const periodEnd = formatDate(store.state.content.form.periodEnd);
      const type = store.state.content.form.type;
      const doses = store.state.content.form.doses;
      const granularity = store.state.content.form.granularity;

      const mapElement = document.querySelector('#map');
      let request = "?tabBy=" + tabBy
      if (sickImmunizer && sickImmunizer.length && type && granularity && periodStart && periodEnd) {
        request += "&sickImmunizer=" + sickImmunizer + "&type=" + type + "&granularity=" + granularity;
        if (Array.isArray(local) && local.length > 1) {
          datasetCities.value = null;
          datasetStates.value = null;
          if (store.state.tabBy === "immunizer" && doses) {
            request += "&doses=" + doses;
            await requestApi(mapElement, map, request, local, period);
          } else {
            await requestApi(mapElement, map, request, local, period);
          }
        }
      } else {
        const map = await queryMap("BR");
        renderMap({ element: mapElement, map });
        return;
      }

      const map = await queryMap(local);
      if (!sickImmunizer || !granularity) {
        return renderMap({ element: mapElement, map });
      }
      try {
        request += "&local=" + local + "&periodStart=" + periodStart + "&periodEnd=" + periodEnd;
        datasetCities.value = null;
        datasetStates.value = null;
        if (store.state.tabBy === "immunizer") {
          request += local + "&type=" + type + "&doses=" + doses;
        }
        datasetCities.value = convertArrayToObject(await api.requestQs(request));

        const cities = await api.request("citiesNames");
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
