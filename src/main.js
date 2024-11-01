import "./assets/css/style.css";
import { createApp, computed, ref } from "vue/dist/vue.esm-bundler";
import store from "./store/";
import router from "./router";
import { computedVar } from "./utils";
import { app as BaseApp } from "./components/app";

export default class MCT {
  constructor({ api = "", baseAddress = "" }) {
    this.api = api;
    this.baseAddress = baseAddress;
    this.render();
  }

  render() {
    const self = this;
    const App = {
      components: { BaseApp },
      setup() {
        const genericModalShow = computed(computedVar({
          store,
          mutation: "content/UPDATE_GENERIC_MODAL_SHOW",
          field: "genericModalShow"
        })
        );
        const genericModalTitle = ref("");
        const genericModalLoading = ref(true);
        // external callbacks
        self.genericModal = async (title, slug) => {
          genericModalLoading.value = true;
          self.genericModal.value = null;
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

        return {
          api: self.api,
          genericModalTitle,
          genericModalLoading,
        }
      },
      template: `<BaseApp
        :api="api"
        v-model:genericModalTitle="genericModalTitle"
        v-model:genericModalLoading="genericModalLoading"
      />`,
    };

    const app = createApp(App);
    app.use(store);
    app.use(router(self.baseAddress));
    app.mount("#app");
  }
}
