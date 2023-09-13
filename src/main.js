import "./assets/css/style.css";
import logo from "./assets/images/logo-vacinabr.svg";

import { createApp, computed, ref, onBeforeMount } from "vue/dist/vue.esm-bundler";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import { NTabs, NTabPane, NTab, NMessageProvider, NButton, NIcon, NModal, NScrollbar } from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";
import { biInfoCircle } from "./icons.js";

export default class MCT {
  constructor(api, baseAddress = "") {
    this.api = api;
    this.baseAddress = baseAddress;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components: { NTabs, NTabPane, NTab, Config, MainCard, NMessageProvider, NButton, NIcon, NModal, NScrollbar },
      setup() {
        const store = useStore();
        const showModal = ref(false);
        const tab = computed(computedVar({ store,  mutation: "content/UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "content/UPDATE_TABBY", field: "tabBy" }));
        const handleUpdateValueTabBy = (tabByName) => {
          tabBy.value = tabByName;
        };
        // Define apiUrl in store state
        onBeforeMount(async () => {
          store.commit("content/SET_API", self.api);
          await store.dispatch("content/requestAbout");
        });
        return {
          tab,
          tabBy,
          api: self.api,
          handleUpdateValueTabBy,
          logo,
          biInfoCircle,
          showModal,
          modalContent: computed(() => {
            const text = store.state.content.about;
            let result = "";
            // TODO: Links inside text should be clickable
            for (let [key, val] of Object.entries(text)){
              let validUrl = null;
              let valFomated = val.replace(/\n/gi, "<br><br>");
              try {
                validUrl = new URL(val);
              }
              catch (e) {
                //Do nothing
              }
              if(validUrl) {
                valFomated = `<a href="${valFomated}" target="about:blank" style="color: #e96f5f">Acessar arquivo</a>`
              }
              result += `<h2 style="margin-bottom: 12px">${key}</h2><p>${valFomated}</p>`;
            }
            return result;
          }),
          bodyStyle: {
            maxWidth: '900px'
          },
        };
      },
      template: `
        <Config>
          <main class="main">
            <n-message-provider>
              <section class="main-header">
                <img :src="logo" width="150">
                <div style="display:flex; gap: 32px; overflow: auto; max-width: 100%; align-items: center" class="mct-scrollbar">
                  <n-button text color="#e96f5f" @click="showModal = true">
                    <template #icon><n-icon v-html="biInfoCircle" /></template>
                    Sobre o projeto
                  </n-button>
                  <n-tabs type="segment" v-model:value="tabBy" @update:value="handleUpdateValueTabBy">
                    <n-tab name="sicks" tab="Por doença" />
                    <n-tab name="immunizers" tab="Imunizante" />
                  </n-tabs>
                  <n-tabs v-model:value="tab" type="segment">
                    <n-tab name="map" tab="Mapa" />
                    <n-tab name="chart" tab="Gráfico"/>
                    <n-tab name="table" tab="Tabela"/>
                  </n-tabs>
                </div>
              </section>
              <div>
                <MainCard :api="api" />
              </div>
              <n-modal
                v-model:show="showModal"
                class="custom-card"
                preset="card"
                :style="bodyStyle"
                title="VacinaBR"
                :bordered="false"
                size="medium"
                transform-origin="center"
              >
              <n-scrollbar class="custom-card-body">
                <div v-html="modalContent"></div>
              </n-scrollbar>
              </n-modal>
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
