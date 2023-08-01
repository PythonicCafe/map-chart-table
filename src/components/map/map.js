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

    const queryMap = async (mapUrl) => {
      const svg = await fetch(mapUrl);
      const mapText = await svg.text();
      return mapText;
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

    const setMap = async () => {
      const local = store.state.form.local;
      const sick = store.state.form.sickImmunizer;
      const period = store.state.form.period;

      const mapElement = document.querySelector('#map');

      // TODO: Update to use local data
      if (!local.length || local.length > 1) {
        const map =
          await queryMap(
            'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=intermediaria&intrarregiao=UF'
          );

        if (sick && sick.length) {
          datasetCities.value = null;
          datasetStates.value = await api.request(sick);
          const states = await api.request("statesAcronym");
          renderMap({ element: mapElement, map, datasetStates: datasetStates.value[period], states, statesSelected: local });
          return;
        }

        renderMap({ element: mapElement, map });
        return;
      }

      // TODO: Update to use local data
      const map = await queryMap(
        `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${local}?formato=image/svg+xml&qualidade=intermediaria&intrarregiao=municipio`
      );
      if (!sick) {
        return renderMap({ element: mapElement, map });
      }
      try {
        datasetCities.value = await api.requestState(local + "/" + sick);
        const cities = await api.requestState(local + "/" + "citiesAcronym");
        datasetStates.value = null;
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
      () => [store.state.form.local, store.state.form.sickImmunizer],
      async () => {
        await setMap();
      }
    )

    watch(
      () => [store.state.form.period],
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
