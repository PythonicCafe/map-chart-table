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
  NSkeleton
} from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";
import { modalWithTabs as ModalWithTabs } from "./components/modalWithTabs.js";
import { modal as Modal } from "./components/modal.js";
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
        Modal,
        ModalWithTabs,
        NScrollbar,
        NTooltip,
        NSkeleton
      },
      setup() {
        const store = useStore();
        const tab = computed(computedVar({ store,  mutation: "content/UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "content/UPDATE_TABBY", field: "tabBy" }));
        const disableMap = computed(() => store.state.content.disableMap);
        const disableChart = computed(() => store.state.content.disableChart);
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
        const genericModalTitle = ref(null);

        // external callbacks
        self.genericModal = async (title, slug) => {
          genericModal.value = null;
          genericModalShow.value = !genericModalShow.value;
          genericModalTitle.value = title;
          await store.dispatch(
            "content/requestPage",
            ["UPDATE_GENERIC_MODAL", slug]
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
              <modal
                v-else
                v-model:show="genericModalShow"
                :title="genericModalTitle"
              >
                <template v-if="modalContent">
                  <div v-html="modalContent"></div>
                </template>
                <template v-else>
                  <n-skeleton
                    :height="48"
                    :sharp="false"
                    size="medium"
                    style="margin-bottom: 24px; margin-top: 12px;"
                  />
                  <n-skeleton text :repeat="6" style="margin-bottom: 8px;" />
                  <n-skeleton text style="width: 40%; margin-bottom: 24px;" />
                  <n-skeleton text :repeat="6" style="margin-bottom: 8px;" />
                  <n-skeleton text style="width: 60%; margin-bottom: 24px;" />
                  <n-skeleton text :repeat="8" style="margin-bottom: 8px;" />
                  <n-skeleton text style=" width: 60%; margin-bottom: 24px;" />
                </template>
              </modal>
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
