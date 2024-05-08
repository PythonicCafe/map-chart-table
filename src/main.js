import "./assets/css/style.css";
import { createApp, computed, ref, onBeforeMount } from "vue/dist/vue.esm-bundler";
import logo from "./assets/images/logo-vacinabr.svg";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import { NTabs, NTabPane, NTab, NMessageProvider, NButton, NIcon, NScrollbar, NTooltip } from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";
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
              [
                ["UPDATE_DOSE_BLOCKS", "dose-blocks"],
                ["UPDATE_GRANULARITY_BLOCKS","granularity-blocks"],
                ["UPDATE_LINK_CSV", "link-csv"],
                ["UPDATE_MANDATORY_VACCINATIONS_YEARS", "mandatory-vaccinations-years"],
                ["UPDATE_LAST_UPDATE_DATE", "lastupdatedate"],
                ["UPDATE_AUTO_FILTERS", "auto-filters"],
                ["UPDATE_ACRONYMS", "acronyms"]
              ].map(request => store.dispatch("content/requestJson", request)),
              [
                ["UPDATE_ABOUT", "?slug=sobre-vacinabr"],
                ["UPDATE_ABOUT_VACCINES", "?slug=sobre-vacinas-vacinabr"],
                ["UPDATE_GLOSSARY", "?slug=glossario-vacinabr"]
              ].map(request => store.dispatch("content/requestPage", request)),
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
          showModal,
          logo,
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
          <section class="main">
            <n-message-provider>
              <section class="main-header">
                <div class="main-header-container mct-scrollbar">
                  <div class="main-header-form">
                    <label class="main-header__label">Pesquisar por:</label>
                    <n-tabs type="segment" v-model:value="tabBy">
                      <n-tab name="sicks" tab="Doença" :disabled="disableAll" />
                      <n-tab name="immunizers" tab="Vacina" :disabled="disableAll" />
                    </n-tabs>
                  </div>
                  <hr class="custom-hr">
                  <div class="main-header-form">
                    <label class="main-header__label">Visualizar por:</label>
                    <n-tabs v-model:value="tab" type="segment">
                      <n-tab name="map" tab="Mapa" :disabled="disableMap || disableAll" />
                      <n-tab name="chart" tab="Gráfico" :disabled="disableChart || disableAll" />
                      <n-tab name="table" tab="Tabela" :disabled="disableAll" />
                    </n-tabs>
                  </div>
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
          </section>
        </Config>
      `,
    };

    const app = createApp(App);
    app.use(store);
    app.use(router(self.baseAddress));
    app.mount("#app");
  }
}
