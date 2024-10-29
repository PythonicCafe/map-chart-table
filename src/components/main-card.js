import { NCard, NSkeleton, useMessage, NModal, NButton, NSpin } from "naive-ui";
import { ref, computed, onBeforeMount, watch } from "vue/dist/vue.esm-bundler";
import { chart as Chart } from "./chart";
import { map as Map } from "./map/map";
import { table as Table } from "./table";
import { subSelect as SubSelect } from "./sub-select";
import { filterSuggestion as FilterSuggestion } from "./filter-suggestion";
import { subButtons as SubButtons } from "./sub-buttons";
import { yearSlider as YearSlider } from "./map/year-slider";
import { mapRange as MapRange } from "./map/map-range";
import { useStore } from 'vuex'
import { mapFields, computedVar } from '../utils';
import { useRouter, useRoute } from 'vue-router';
import { formatToApi } from "../common";

export const mainCard = {
  components:  {
    NCard,
    Chart,
    Map,
    Table,
    FilterSuggestion,
    SubSelect,
    SubButtons,
    YearSlider,
    MapRange,
    NSkeleton,
    NModal,
    NButton,
    NSpin
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
    const map = ref(null);
    const mapData = ref([]);
    const mapTooltip = ref([]);
    const show = computed(computedVar({ store,  mutation: "content/UPDATE_LOADING", field: "loading" }));
    const isMobileScreen = ref(null);
    const formPopulated = computed(() => store.getters["content/selectsEmpty"]);
    const getWindowWidth = () => {
      isMobileScreen.value = window.innerWidth <= 1368;
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

    const URLquery = { ...route.query };
    const removeQueryFromRouter = (key) => {
        delete URLquery[key];
        message.warning('URL contém valor inválido para filtragem')
        router.replace({ query: URLquery });
    }

    const setStateFromUrl = () => {
      const formState = store.state.content.form
      const routeArgs = { ...route.query };
      const routerResult = {};
      const routerResultTabs = {};

      if (!Object.keys(routeArgs).length) {
        return;
      }

      for (const [key, value] of Object.entries(routeArgs)) {
        if (key === "sickImmunizer") {
          if (value.includes(",")) {
            const values = value.split(",")
            const sicks = formState["sicks"].map(el => el.value)
            const immunizers = formState["immunizers"].map(el => el.value)
            if (
              values.every(val => sicks.includes(val)) ||
              values.every(val => immunizers.includes(val))
            ) {
                routerResult[key] = values;
            } else {
              removeQueryFromRouter(key);
            }
          } else if (
            formState["sicks"].some(el => el.value === value) ||
            formState["immunizers"].some(el => el.value === value)
          ) {
            routerResult[key] = value;
          } else {
            removeQueryFromRouter(key);
          }
        } else if (key === "local") {
          const values = value.split(",")
          const locals = formState["locals"].map(el => el.value)
          if (values.every(val => locals.includes(val))) {
              routerResult[key] = values;
          } else {
            removeQueryFromRouter(key);
          }
        } else if (key === "granularity") {
          formState["granularities"].some(el => el.value === value) ?
            routerResult[key] = value : removeQueryFromRouter(key);
        } else if (key === "dose") {
          formState["doses"].some(el => el.value === value) ?
            routerResult[key] = value : removeQueryFromRouter(key);
        } else if (key === "type") {
          formState["types"].some(el => el.value === value) ?
            routerResult[key] = value : removeQueryFromRouter(key);
        } else if (key === "tab") {
          ["map", "chart", "table"].some(el => el === value) ?
            routerResultTabs[key] = value : removeQueryFromRouter(key);
        } else if (key === "tabBy") {
          ["immunizers", "sicks"].some(el => el === value) ?
            routerResultTabs[key] = value : removeQueryFromRouter(key);
        } else if (["periodStart", "periodEnd"].includes(key)) {
          const resultValue = Number(value)
          formState["years"].some(el => el.value === resultValue) ?
            routerResult[key] = resultValue : removeQueryFromRouter(key);
        } else if (key === "period") {
          routerResult[key] = Number(value);
        } else if (value.includes(",")) {
          routerResult[key] = value.split(",");
        } else {
          routerResult[key] = value ?? null;
        }
      }

      store.commit("content/UPDATE_FROM_URL", {
        tab: routerResultTabs?.tab ? routerResultTabs.tab : "map",
        tabBy: routerResultTabs?.tabBy ?  routerResultTabs.tabBy : "sicks",
        form: { ...routerResult },
      });
    };

    const setUrlFromState = () => {
      const routeArgs = { ...route.query };
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

      if (!JSON.stringify(routeArgs) == JSON.stringify(stateResult)) {
        return;
      }

      return router.replace({ query: stateResult });
    }

    watch(() => {
        const form = store.state.content.form;
        return [form.sickImmunizer, form.type, form.dose, form.local,
          form.period, form.periodStart, form.periodEnd,
          form.granularity, store.state.content.tab, store.state.content.tabBy]
      },
      async () => {
        setUrlFromState();
      }
    )

    onBeforeMount(async () => {
      getWindowWidth();
      await store.dispatch("content/updateFormSelect");
      setStateFromUrl();
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
      map,
      mapData,
      mapTooltip,
      mainTitle: computed(() => store.getters[`content/mainTitle`]),
      subTitle: computed(() => store.getters[`content/subTitle`]),
      form,
      tab,
      showModal: ref(false),
      isMobileScreen,
      show,
      formPopulated
    };
  },
  template: `
    <section>
      <template v-if="isMobileScreen">
        <div class="filter-mobile-button">
          <n-button
            type="primary"
            round
            @click="showModal = true"
            style="width: 240px; margin: 12px 0px;"
          >Filtrar
        </n-button>
        </div>
        <n-modal
          v-model:show="showModal"
          transform-origin="center"
          preset="card"
          style="width: 100%; min-height: 100vh"
        >
          <n-card
            :bordered="false"
            size="huge"
          >
            <SubSelect :modal="true" />
            <div class="filter-mobile-button">
              <n-button
                type="primary"
                round @click="showModal = false"
                style="width: 240px; margin-top: 32px;"
              >Pronto
              </n-button>
            </div>
          </n-card>
        </n-modal>
      </template>
      <div class="sub-select-container" v-else>
        <SubSelect />
      </div>
      <div class="main-content">
        <n-spin :show="show.loading">
          <div style="min-height: 4.8rem">
            <h2
              v-if="mainTitle"
              style="margin: 0px; padding: 0px; font-weight: 700; font-size: 1.5rem"
            >{{ mainTitle }}
            </h2>
            <n-skeleton
              v-else
              height="2.3rem"
              width="60%"
              :animated="false"
            />
            <h3
              v-if="subTitle"
              style="margin: 0px; padding: 0px; font-weight: 400; font-size: 1.25rem"
            >{{ subTitle }}
            </h3>
            <n-skeleton
              v-else
              height="2rem"
              width="45%"
              :animated="false"
              style="margin-top: 4px"
            />
          </div>
          <section style="map-section">
            <template v-if="tab === 'map'">
              <div>
                <div style="display: flex; gap: 12px">
                  <MapRange :mapData="mapData" :mapTooltip="mapTooltip" />
                  <div style="width: 100%;">
                    <Map
                      ref="map"
                      :api='api'
                      @map-change="handleMapChange"
                      @map-tooltip="handleMapTooltip"
                    />
                    <YearSlider />
                  </div>
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
          <FilterSuggestion v-if="formPopulated" />
        </n-spin>
      </div>
      <div class="main-content main-content--sub">
        <SubButtons />
      </div>
    </section>
  `,
}
