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

    const setMap = async () => {
      const local = store.state.content.form.local;
      const sickImmunizer = store.state.content.form.sickImmunizer;
      const tab = store.state.content.tabBy;
      const period = store.state.content.form.period;
      const type = store.state.content.form.type;
      const granularity = store.state.content.form.granularity;

      const mapElement = document.querySelector('#map');

      if (!local.length || local.length > 1) {
        const map = await queryMap("BR");

        if (sickImmunizer && sickImmunizer.length && type && granularity) {
          datasetCities.value = null;
          try {
            datasetStates.value = await api.request("?tab=" + tab + "&sickImmunizer=" + sickImmunizer);
            const states = await api.request("statesAcronym");
            renderMap({ element: mapElement, map, datasetStates: datasetStates.value[period], states, statesSelected: local });
          } catch (e) {
            renderMap({ element: mapElement, map });
          }
          return;
        }

        renderMap({ element: mapElement, map });
        return;
      }

      const map = await queryMap(local);
      if (!sickImmunizer || !type || !granularity) {
        return renderMap({ element: mapElement, map });
      }
      try {
        datasetCities.value = await api.requestState("?tab=" + tab + "&local=" + local + "&sickImmunizer=" + sickImmunizer);
        const cities = await api.request("?citiesAcronym=" + local);
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
