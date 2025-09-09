import "./assets/css/style.css";
import { createApp, computed, ref, onBeforeMount } from "vue/dist/vue.esm-bundler";
import logo from "./assets/images/logo-vacinabr.svg";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import
{
  NTabs,
  NTabPane,
  NTab,
  NMessageProvider,
  NButton,
  NIcon,
  NScrollbar,
  NTooltip,
  NSkeleton,
  NEmpty
} from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";
import { modalWithTabs as ModalWithTabs } from "./components/modalWithTabs.js";
import { modalGeneric as ModalGeneric } from "./components/modalGeneric.js";
import { biMap, biGraphUp, biTable } from "./icons.js";

export default class MCT {
  constructor({ api = "", baseAddress = "" }) {
    this.api = api;
    this.baseAddress = baseAddress;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components:
      {
        NTabs,
        NTabPane,
        NTab,
        Config,
        MainCard,
        NMessageProvider,
        NButton,
        NIcon,
        ModalGeneric,
        ModalWithTabs,
        NScrollbar,
        NTooltip,
        NSkeleton,
        NEmpty
      },
      setup() {
        const store = useStore();
        const tab = computed(computedVar({ store,  mutation: "content/UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "content/UPDATE_TABBY", field: "tabBy" }));
        const disableMap = computed(() => store.state.content.disableMap);
        const disableChart = computed(() => store.state.content.disableChart);
        const genericModalTitle = computed(computedVar({
            store,
            mutation: "content/UPDATE_GENERIC_MODAL_TITLE",
            field: "genericModalTitle"
          })
        );
        const genericModal = computed(computedVar({
            store,
            mutation: "content/UPDATE_GENERIC_MODAL",
            field: "genericModal"
          })
        );
        const genericModalShow = computed(computedVar({
            store,
            mutation: "content/UPDATE_GENERIC_MODAL_SHOW",
            field: "genericModalShow"
          })
        );
        const genericModalLoading = computed(computedVar({
            store,
            mutation: "content/UPDATE_GENERIC_MODAL_LOADING",
            field: "genericModalLoading"
          })
        );

        // external callbacks
        self.genericModal = async (title, slug) => {
          genericModalLoading.value = true;
          genericModal.value = null;
          genericModalShow.value = !genericModalShow.value;
          genericModalTitle.value = title;
          try {
            await store.dispatch(
              "content/requestPage",
              ["UPDATE_GENERIC_MODAL", slug]
            );
          } catch {
            // Do Nothing
          }
          genericModalLoading.value = false;
        }

        // Define extra button in filters
        self.genericModalWithFilterButton = async (title, slug) => {
          await store.dispatch(
            "content/updateExtraFilterButton",
            [title, slug]
          );
        }

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
                ["UPDATE_ABOUT_VACCINES", "?slug=sobre-vacinas-vacinabr"],
              ].map(request => store.dispatch("content/requestPage", request)),
             ]
          );
        });

        const modalContent = computed(() => {
          const text = store.state.content.genericModal;
          if (!text || !text.length) {
            return
          }
          const div = document.createElement("div");
          div.innerHTML = text[0].content.rendered;

          if (div.querySelector("table")) {
            const result = [...div.querySelectorAll("table>tbody>tr")].map(
              tr => { return {
                  header: tr.querySelectorAll("td")[0].innerHTML,
                  content: tr.querySelectorAll("td")[1].innerHTML
                }
              }
            )
            return result;
          }

          return text[0].content.rendered;
        })

        return {
          tab,
          tabBy,
          api: self.api,
          genericModalShow,
          genericModalLoading,
          genericModalTitle,
          logo,
          disableMap,
          disableChart,
          modalContent,
          disableAll: computed(() => store.state.content.yearSlideAnimation),
          biMap,
          biGraphUp,
          biTable,
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
                <div class="main-header-container">
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
                      <n-tab name="map" :disabled="disableMap || disableAll">
                       <n-icon class="main-header__tab-icon" v-html="biMap" />
                       <span class="main-header__tab-label">Mapa</span>
                      </n-tab>
                      <n-tab name="chart" :disabled="disableChart || disableAll">
                       <n-icon class="main-header__tab-icon" v-html="biGraphUp" />
                       <span class="main-header__tab-label">Gráfico</span>
                      </n-tab>
                      <n-tab name="table" :disabled="disableAll">
                       <n-icon class="main-header__tab-icon" v-html="biTable" />
                       <span class="main-header__tab-label">Tabela</span>
                      </n-tab>
                    </n-tabs>
                  </div>
                </div>
              </section>
              <div>
                <MainCard :api="api" />
              </div>
              <modalWithTabs
                v-if="Array.isArray(modalContent)"
                v-model:show="genericModalShow"
                :title="genericModalTitle"
                :data="modalContent"
              />
              <modalGeneric
                v-else
                v-model:show="genericModalShow"
                :title="genericModalTitle"
                :loading="genericModalLoading"
                :modalContent="modalContent"
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
