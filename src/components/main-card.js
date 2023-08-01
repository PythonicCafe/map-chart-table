import { NCard, NSkeleton } from "naive-ui";
import { ref, computed, onBeforeMount } from "vue/dist/vue.esm-bundler";
import { chart as Chart } from "./chart";
import { map as Map } from "./map/map";
import { table as Table } from "./table";
import { subSelect as SubSelect } from "./sub-select";
import { subButtons as SubButtons } from "./sub-buttons";
import { yearSlider as YearSlider } from "./map/year-slider";
import { mapRange as MapRange } from "./map/map-range";
import { useStore } from 'vuex'
import { mapFields } from '../utils';
import { useRouter, useRoute } from 'vue-router';

export const mainCard = {
  components:  {
    NCard,
    Chart,
    Map,
    Table,
    SubSelect,
    SubButtons,
    YearSlider,
    MapRange,
    NSkeleton
  },
  props: {
    api: {
      type: String,
      required: true
    },
  },
  setup() {
    const store = useStore();
    const mapData = ref([]);
    const mapTooltip = ref([]);
    const tab = computed(() => store.state.tab);
    const form = computed(() => mapFields(
      {
        store,
        fields: [
          "sickImmunizer",
          "sicksImmunizers",
          "type",
          "types",
          "local",
          "locals",
          "period",
          "periods",
          "periodStart",
          "periodEnd",
          "granurality",
          "granuralities"
        ],
        base: "form",
        mutation: "UPDATE_FORM"
      })
    );

    const router = useRouter();
    const route = useRoute();

    const handleMapChange = (datasetValues) => {
      mapData.value = datasetValues;
    };

    const handleMapTooltip = (tooltip) => {
      mapTooltip.value = tooltip;
    };


    onBeforeMount(async () => {
      // Set sicks options
      await store.dispatch("updateSicksImmunizers", "sicks")
      // Set locals options
      store.dispatch("updateLocals", "sicks")

      // TODO: How years range will work
      // TODO: Get states from API
    });


    return {
      handleMapChange,
      handleMapTooltip,
      mapData,
      mapTooltip,
      mainTitle: computed(() => store.getters[`mainTitle`]),
      subTitle: computed(() => store.getters[`subTitle`]),
      form,
      tab
    };
  },
  template: `
    <n-card style="border: #D8D8D8 1px solid">
      <SubSelect />
      <h2 v-if="mainTitle" style="margin: 0px; padding: 0px; font-weight: 700; font-size: 1.5rem">
        {{ mainTitle }}
      </h2>
      <n-skeleton v-else height="40px" width="40%" :animated="false" />
      <div style="margin-top: 0px; margin-bottom: 16px">
        <h3 v-if="subTitle" style="margin: 0px; padding: 0px; font-weight: 400; font-size: 1.25rem">
         {{ subTitle }}
        </h3>
        <n-skeleton v-else height="30px" width="45%" :animated="false" style="margin-top: 5px;" />
      </div>
      <section>
        <template v-if="tab === 'map'">
          <div style="display: flex; gap: 12px">
            <MapRange :mapData="mapData" :mapTooltip="mapTooltip" />
            <div style="width: 100%;">
              <Map
                :api='api'
                @map-change="handleMapChange"
                @map-tooltip="handleMapTooltip"
              />
              <YearSlider />
            </div>
          </div>
        </template>
        <template v-else-if="tab === 'chart'">
          <Chart />
        </template>
        <template v-else>
          <Table />
        </template>
      </section>
      <SubButtons />
    </n-card>
  `,
}
