import { NCard, NSkeleton, useMessage, NModal, NButton } from "naive-ui";
import { ref, computed, onBeforeMount, watch } from "vue/dist/vue.esm-bundler";
import { chart as Chart } from "./chart";
import { map as Map } from "./map/map";
import { table as Table } from "./table";
import { subSelect as SubSelect } from "./sub-select";
import { subButtons as SubButtons } from "./sub-buttons";
import { yearSlider as YearSlider } from "./map/year-slider";
import { mapRange as MapRange } from "./map/map-range";
import { useStore } from 'vuex'
import { mapFields, convertDateToUtc } from '../utils';
import { useRouter, useRoute } from 'vue-router';
import { formatToApi } from "../common";

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
    NSkeleton,
    NModal,
    NButton
  },
  props: {
    api: {
      type: String,
      required: true
    },
  },
  setup() {
    const store = useStore();
    const message = useMessage();
    const mapData = ref([]);
    const mapTooltip = ref([]);
    const isMobileScreen = ref(null);
    const getWindowWidth = () => {
      isMobileScreen.value = window.innerWidth <= 1350;
    }
    window.addEventListener('resize', getWindowWidth)
    const tab = computed(() => store.state.content.tab);
    const form = computed(() => mapFields(
      {
        store,
        fields: [
          "sickImmunizer",
          "sicksImmunizers",
          "type",
          "dose",
          "types",
          "local",
          "locals",
          "period",
          "periods",
          "periodStart",
          "periodEnd",
          "granularity",
          "granularities",
        ],
        base: "form",
        mutation: "content/UPDATE_FORM"
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

    const setStateFromUrl = () => {
      const routeArgs = route.query;
      const routerResult = {};

      for (const [key, value] of Object.entries(routeArgs)) {
        const result = new Date(String(value));
        if (key === "period") {
          routerResult[key] = Number(value);
          continue;
        }
        if (result instanceof Date && !isNaN(result.getTime())) {
          const currentYear = new Date().getFullYear();
          if (Number(value) <= currentYear) {
            routerResult[key] = convertDateToUtc(String(value));
          } else {
            routerResult[key] = convertDateToUtc(String(currentYear));
          }
          continue;
        }
        if (value.includes(",")){
          routerResult[key] = value.split(",");
          continue
        }
        routerResult[key] = value;
      }

      const modelResult = {};

      for (const field of Object.entries(form.value)) {
        if (routerResult[field[0]]) {
          modelResult[field[0]] = routerResult[field[0]] ?? null;
        }
      }

      store.commit("content/UPDATE_FROM_URL", {
        tab: routeArgs?.tab ? routeArgs.tab : "map",
        tabBy: routeArgs?.tabBy ?  routeArgs.tabBy : "sicks",
        form: { ...modelResult },
      });
    };

    const setUrlFromState = () => {
      let stateResult = formatToApi({
        form: { ...store.state.content.form },
        tab: store.state.content.tab !== "map" ? store.state.content.tab : undefined,
        tabBy: store.state.content.tabBy !== "sicks" ? store.state.content.tabBy : undefined,
      });
      if (Array.isArray(stateResult.sickImmunizer) && stateResult.sickImmunizer.length) {
        stateResult.sickImmunizer = [...stateResult?.sickImmunizer].join(",");
      }
      if (Array.isArray(stateResult.local) && stateResult.local.length) {
        stateResult.local = [...stateResult?.local].join(",");
      }
      router.push({ query: stateResult })
    }

    watch(
      () => [
        store.state.content.form.sickImmunizer,
        store.state.content.form.type,
        store.state.content.form.dose,
        store.state.content.form.local,
        store.state.content.form.period,
        store.state.content.form.periodStart,
        store.state.content.form.periodEnd,
        store.state.content.form.granularity,
        store.state.content.tab,
        store.state.content.tabBy
      ],
      () => {
        setUrlFromState()
      }
    )

    onBeforeMount(async () => {
      getWindowWidth();
      await store.dispatch("content/updateFormSelect");
      setStateFromUrl()
    });

    // Show messages from state
    store.subscribe((mutation, state) => {
      if (
        [
          "message/ERROR",
          "message/SUCCESS",
          "message/INFO",
          "message/WARNING",
        ].includes(mutation.type)
      ) {
        message.create(state.message.message, { type: state.message.type });
        store.commit("message/CLEAR");
      }
    });

    return {
      handleMapChange,
      handleMapTooltip,
      mapData,
      mapTooltip,
      mainTitle: computed(() => store.getters[`content/mainTitle`]),
      subTitle: computed(() => store.getters[`content/subTitle`]),
      form,
      tab,
      showModal: ref(false),
      isMobileScreen
    };
  },
  template: `
    <n-card style="border: #D8D8D8 1px solid">
      <template v-if="isMobileScreen">
        <n-button type="primary" round @click="showModal = true" style="width: 100%; margin: 12px 0px">Filtrar</n-button>
        <n-modal v-model:show="showModal" transform-origin="center" preset="card" style="width: 100%; min-height: 100vh">
          <n-card
            :bordered="false"
            size="huge"
          >
            <SubSelect :modal="true" />
            <n-button type="primary" round @click="showModal = false" style="width: 100%; margin: 12px 0px">Pronto</n-button>
          </n-card>
        </n-modal>
      </template>
      <template v-else>
        <SubSelect />
      </template>
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
