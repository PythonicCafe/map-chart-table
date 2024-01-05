import { computed } from "vue/dist/vue.esm-bundler";
import { NModal, NScrollbar, NTabs, NTabPane } from "naive-ui";

export const modalWithTabs = {
  components:  {
    NModal,
    NScrollbar,
    NTabs,
    NTabPane
  },
  props: {
    data: {
      type: Array 
    },
    show: {
      type: Boolean
    },
    title: {
      type: String
    }
  },
  setup (props, { emit }) {
    const showModal = computed({
      get() {
        return props.show;
      },
      set(value) {
        emit("update:show", value);
      }
    });

    const aboutVaccines = computed(() => props.data);
    return {
      bodyStyle: {
        maxWidth: '900px',
      },
      showModal,
      aboutVaccines
    }
  },
  template: `
    <n-modal
      v-model:show="showModal"
      class="custom-card"
      preset="card"
      :style="bodyStyle"
      :title="title"
      :bordered="false"
      size="medium"
      transform-origin="center"
    >
      <n-scrollbar class="custom-card-body">
        <n-tabs type="line">
          <n-tab-pane
            v-for="item in aboutVaccines"
            :name="item.header.replaceAll('&amp;', '').replaceAll('amp;', '&')"
            :tab="item.header.replaceAll('&amp;', '').replaceAll('amp;', '&')"
          >
            <n-scrollbar style="height: 75vh; line-height: 26px;">
              <div v-html="item.content"></div>
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
      </n-scrollbar>
    </n-modal>
  `,
}
