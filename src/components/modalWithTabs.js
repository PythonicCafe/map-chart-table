import { computed } from "vue/dist/vue.esm-bundler";
import { NModal, NScrollbar, NTabs, NTabPane, NSpin } from "naive-ui";

export const modalWithTabs = {
  components:  {
    NModal,
    NScrollbar,
    NTabs,
    NTabPane,
    NSpin
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

    const items = computed(() => props.data);
    return {
      bodyStyle: {
        maxWidth: '900px',
      },
      showModal,
      items
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
      <n-scrollbar class="custom-card-body custom-card-body--height">
        <n-tabs v-if="items" type="line">
          <n-tab-pane
            v-for="item in items"
            :name="item.header.replaceAll('&amp;', '').replaceAll('amp;', '&')"
            :tab="item.header.replaceAll('&amp;', '').replaceAll('amp;', '&')"
          >
            <n-scrollbar style="height: 75vh; line-height: 26px;">
              <div v-html="item.content"></div>
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
        <div v-else>
          <n-spin  :show="true" />
        </div>
      </n-scrollbar>
    </n-modal>
  `,
}
