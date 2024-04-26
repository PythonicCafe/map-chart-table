import "./assets/css/style.css";
import logo from "./assets/images/logo-vacinabr.svg";
import { createApp, computed, ref, onBeforeMount } from "vue/dist/vue.esm-bundler";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import { NTabs, NTabPane, NTab, NMessageProvider, NButton, NIcon, NScrollbar, NTooltip } from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";
import { biInfoCircle } from "./icons.js";
import { modalWithTabs as Modal } from "./components/modalWithTabs.js";

export default class MCT {
  constructor({ api = "", baseAddress = "" }) {
    this.api = api;
    this.baseAddress = baseAddress;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components: { NTabs, NTabPane, NTab, Config, MainCard, NMessageProvider, NButton, NIcon, Modal, NScrollbar, NTooltip },
      setup() {
        const store = useStore();
        const showModal = ref(false);
        const tab = computed(computedVar({ store,  mutation: "content/UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "content/UPDATE_TABBY", field: "tabBy" }));
        const disableMap = computed(() => store.state.content.disableMap);
        const disableChart = computed(() => store.state.content.disableChart);
        // Define apiUrl in store state
        onBeforeMount(async () => {
          store.commit("content/SET_API", self.api);
          await Promise.all(
            [
              store.dispatch("content/requestDoseBlocks"),
              store.dispatch("content/requestGranularityBlocks"),
              store.dispatch("content/requestAbout"),
              store.dispatch("content/requestAboutVaccines"),
              store.dispatch("content/requestLink"),
              store.dispatch("content/requestMandatoryVaccination"),
              store.dispatch("content/requestGlossary"),
              store.dispatch("content/requestLastUpdateDate"),
              store.dispatch("content/requestAutoFilters"),
             ]
          );
        });

        const modalContent = computed(() => {
          const text = store.state.content.about;
          if (!text || !text.length) {
            return
          }
          const div = document.createElement("div");
          div.innerHTML = text[0].content.rendered
          const result = [...div.querySelectorAll("table>tbody>tr")].map(
            tr => {
              return {
                header: tr.querySelectorAll("td")[0].innerHTML,
                content: tr.querySelectorAll("td")[1].innerHTML
              }
            }
          )
          return result;
        })

        return {
          tab,
          tabBy,
          api: self.api,
          logo,
          biInfoCircle,
          showModal,
          disableMap,
          disableChart,
          modalContent,
          disableAll: computed(() => store.state.content.yearSlideAnimation),
          bodyStyle: {
            maxWidth: '900px'
          },
        };
      },
      template: `
        <Config>
          <main class="main" style="max-width: 1500px; margin: 0px auto;">
            <n-message-provider>
              <section class="main-header">
                <div style="display:flex; align-items: end; gap: 10px">
                  <div>
                    <img :src="logo" width="150">
                  </div>
                </div>
                <div style="display:flex; gap: 32px; overflow: auto; max-width: 100%; align-items: center" class="mct-scrollbar">
                  <n-button v-if="modalContent" text color="#e96f5f" @click="showModal = true">
                    <template #icon><n-icon v-html="biInfoCircle" /></template>
                    Sobre o projeto
                  </n-button>
                  <n-tabs type="segment" v-model:value="tabBy">
                    <n-tab name="sicks" tab="Por doença" :disabled="disableAll" />
                    <n-tab name="immunizers" tab="Vacina" :disabled="disableAll" />
                  </n-tabs>
                  <n-tabs v-model:value="tab" type="segment">
                    <n-tab name="map" tab="Mapa" :disabled="disableMap || disableAll" />
                    <n-tab name="chart" tab="Gráfico" :disabled="disableChart || disableAll" />
                    <n-tab name="table" tab="Tabela" :disabled="disableAll" />
                  </n-tabs>
                </div>
              </section>
              <div>
                <MainCard :api="api" />
              </div>
              <modal
                v-if="modalContent"
                v-model:show="showModal"
                title="Sobre o projeto"
                :data="modalContent"
              />
            </n-message-provider>
          </main>
        </Config>
      `,
    };

    const app = createApp(App);
    app.use(store);
    app.use(router(self.baseAddress));
    app.mount("#app");
  }
}
