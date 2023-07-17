import { NCard } from "naive-ui";
import { ref, computed, onBeforeMount } from "vue/dist/vue.esm-bundler";
import { chart as Chart } from "./chart";
import { map as Map } from "./map/map";
import { table as Table } from "./table";
import { subSelect as SubSelect } from "./sub-select";
import { subButtons as SubButtons } from "./sub-buttons";
import { yearSlider as YearSlider } from "./map/year-slider";
import { mapRange as MapRange } from "./map/map-range";
import { DataFetcher } from "../data-fetcher";
import { ufs } from "../exampleData";

export const mainCard = {
  components:  {
    NCard,
    Chart,
    Map,
    Table,
    SubSelect,
    SubButtons,
    YearSlider,
    MapRange
  },
  props: {
    api: {
      type: String,
      required: true
    },
    mainTitle: {
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
  },
  setup(props) {
    const mapData = ref([]);
    const mapTooltip = ref([]);
    const mainTitle = computed(() => props.mainTitle);

    const handleMapChange = (datasetValues) => {
      mapData.value = datasetValues;
    };

    const handleMapTooltip = (tooltip) => {
      mapTooltip.value = tooltip;
    };

    const api = new DataFetcher(props.api);

    const form = ref({
        sick: null,
        sicks: [],
        type: null,
        types: [],
        local: [],
        locals: [],
        period: null,
        periods: null,
        granurality: null,
        granuralities: [],
    });

    onBeforeMount(async () => {
      let [sicks, locals] = await Promise.all([
        api.request("options"),
        api.request("statesAcronym")
      ]);
      // Set sicks options
      form.value.sicks = sicks.result.map(x => { return { label: x, value: x } })
      // Set locals options
      locals = Object.values(form.value.locals).map(x => x.acronym).sort();
      locals.unshift("BR");
      locals.value = locals.map((local) =>  { return { label: local, value: local } } );

      // TODO: How years range will work
      // TODO: Get states from API
      form.value.locals = ufs;
    });

    return {
      handleMapChange,
      handleMapTooltip,
      mapData,
      mapTooltip,
      mainTitle,
      form
    };
  },
  template: `
    <n-card style="border: #D8D8D8 1px solid">
      <SubSelect
        :api="api"
        :tab="tab"
        :tab-by="tabBy"
        v-model:form="form"
      />
      <h2 style="margin: 0px; font-weight: 700; font-size: 1.5rem">
       {{ mainTitle }}
      </h2>
      <h3 style="margin-top: 5px; font-weight: 400; font-size: 1.25rem">
        Cobertura vacinal estimada de BCG, considerando população-alvo
      </h3>
      <section>
        <template v-if="tab === 'map'">
          <div style="display: flex; gap: 12px">
            <MapRange :mapData="mapData" :mapTooltip="mapTooltip" />
            <div style="width: 100%;">
              <Map
                v-model:form="form"
                :api='api'
                @map-change="handleMapChange"
                @map-tooltip="handleMapTooltip"
              />
              <YearSlider v-model:form="form" />
            </div>
          </div>
        </template>
        <template v-else-if="tab === 'chart'">
          <Chart :api='api' v-model:form="form" />
        </template>
        <template v-else>
          <Table :api='api' v-model:form="form" />
        </template>
      </section>
      <SubButtons />
    </n-card>
  `,
}
