import "./assets/css/style.css";

import { createApp, ref, computed } from "vue/dist/vue.esm-bundler";
import store from "./store/";
import { config as Config } from "./components/config";
import { mainCard as MainCard } from "./components/main-card";
import { NTabs, NTabPane, NTab } from "naive-ui";
import { useStore } from "vuex";
import { computedVar } from "./utils";


export default class MCT {
  constructor(api) {
    this.api = api;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components: { NTabs, NTabPane, NTab, Config, MainCard },
      setup() {
        const store = useStore();
        const tab = computed(computedVar({ store,  mutation: "UPDATE_TAB", field: "tab" }));
        const tabBy = computed(computedVar({ store, mutation: "UPDATE_TABBY", field: "tabBy" }));

        const handleUpdateValueTabBy = (tabByName) => {
          tabBy.value = tabByName;
        };
        const handleUpdateValueTab = (tabName) => {
          tab.value = tabName;
        };
        return {
          tab,
          tabBy,
          api: self.api,
          handleUpdateValueTab,
          handleUpdateValueTabBy
        };
      },
      template: `
        <Config>
          <main class="main">
            <section class="main-header">
              <h1 style="margin:0px; color: #e96f5f">VacinasBR</h1>
              <div style="display:flex; gap: 32px; overflow: auto">
                <n-tabs type="segment" v-model:value="tabBy">
                  <n-tab name="sick" tab="Por doença" />
                  <n-tab name="immunizing" tab="Imunizante" />
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
          </main>
        </Config>
      `,
    };

    const app = createApp(App);
    app.use(store);
    app.mount("#app");
  }
}
