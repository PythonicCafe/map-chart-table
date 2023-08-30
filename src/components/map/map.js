import { DataFetcher } from "../../data-fetcher";
import { MapChart } from "../../map-chart";
import { ref, onMounted, watch } from "vue/dist/vue.esm-bundler";
import { NSelect, NSpin, NButton, NFormItem } from "naive-ui";
import { useStore } from "vuex";
import { formatDate, convertArrayToObject } from "../../utils";

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
      const map = Array.isArray(local) && local.length > 1 ? "BR" : local;
      const file = await import(`../../assets/images/maps/${map}.svg`);
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

    const requestApiRender = async (mapElement, map, request, local, period) => {
      try {
        const result = await api.requestQs(request);
        datasetStates.value = result.data;
        const states = await api.request("statesNames");
        renderMap({ element: mapElement, map, datasetStates: datasetStates.value[period], states, statesSelected: local });
      } catch (e) {
        renderMap({ element: mapElement, map });
      }
    }

    const setMap = async () => {
      const local = store.state.content.form.local;
      const sickImmunizer = store.state.content.form.sickImmunizer;
      const tabBy = store.state.content.tabBy;
      const period = store.state.content.form.period;
      const periodStart = formatDate(store.state.content.form.periodStart);
      const periodEnd = formatDate(store.state.content.form.periodEnd);
      const type = store.state.content.form.type;
      const dose = store.state.content.form.dose;
      const granularity = store.state.content.form.granularity;

      const mapElement = document.querySelector('#map');
      let request = "?tabBy=" + tabBy
      if (sickImmunizer && sickImmunizer.length && type && granularity && periodStart && periodEnd && local) {
        request += "&sickImmunizer=" + sickImmunizer + "&type=" + type + "&granularity=" + granularity;
        if (dose) {
          request += "&dose=" + dose;
        }
        if (Array.isArray(local) && local.length > 1) {
          datasetCities.value = null;
          datasetStates.value = null;
          const map = await queryMap("BR");
          await requestApiRender(mapElement, map, request, local, period);
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
        if (dose) {
          request += "&dose=" + dose;
        }
        datasetCities.value = null;
        datasetStates.value = null;
        const result = await api.requestQs(request);
        datasetCities.value = convertArrayToObject(result.data).data;

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
        store.state.content.form.dose,
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
