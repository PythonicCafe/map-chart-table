import { DataFetcher } from "../../data-fetcher";
import { MapChart } from "../../map-chart";
import { ref, onMounted, watch, onBeforeMount } from "vue/dist/vue.esm-bundler";
import { NSelect, NSpin, NButton, NFormItem } from "naive-ui";

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
    },
    form: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const api = new DataFetcher(props.api);
    const loading = ref(true);
    const yearMapElement = ref(null);
    const mapChart = ref(null);

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
      const local = props.form.local;
      const sick = props.form.sick;
      const period = props.form.period;

      const mapElement = document.querySelector('#map');

      // TODO: Update to use local data
      if (!local.length || local.length > 1) {
        const map =
          await queryMap(
            'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=intermediaria&intrarregiao=UF'
          );

        if (sick) {
          const datasetStates = await api.request(sick);
          const states = await api.request("statesAcronym");
          renderMap({ element: mapElement, map, datasetStates: datasetStates[period], states, statesSelected: local });
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
        const datasetCities = await api.requestState(local + "/" + sick);
        const cities = await api.requestState(local + "/" + "citiesAcronym");
        renderMap({ element: mapElement, map, datasetCities: datasetCities[period], cities });
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
      () => [props.form.local, props.form.sick, props.form.period],
      async () => {
        await setMap();
      }
    )

    onBeforeMount(() => {
      if(props.form.sick && Array.isArray(props.form.sick)) {
        emit("update:form",  {
          ...props.form,
          sick: props.form.sick[0]
        })
      }
    })

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
