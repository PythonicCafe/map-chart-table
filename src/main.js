import "./assets/css/style.css";
import logo from "./assets/images/logo-vacinabr.svg";

import { createApp, computed } from "vue/dist/vue.esm-bundler";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import { NTabs, NTabPane, NTab, NMessageProvider } from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";
import router from "./router";

export default class MCT {
  constructor(api, baseAddress = "") {
    this.api = api;
    this.baseAddress = baseAddress;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components: { NTabs, NTabPane, NTab, Config, MainCard, NMessageProvider },
      setup() {
        const store = useStore();
        const tab = computed(computedVar({ store,  mutation: "content/UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "content/UPDATE_TABBY", field: "tabBy" }));
        const handleUpdateValueTabBy = (tabByName) => {
          tabBy.value = tabByName;
        };
        // Define apiUrl in store state
        store.commit("content/SET_API", self.api);
        return {
          tab,
          tabBy,
          api: self.api,
          handleUpdateValueTabBy,
          logo
        };
      },
      template: `
        <Config>
          <main class="main">
            <n-message-provider>
              <section class="main-header">
                <img :src="logo" width="150">
                <div style="display:flex; gap: 32px; overflow: auto; max-width: 100%" class="mct-scrollbar">
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
