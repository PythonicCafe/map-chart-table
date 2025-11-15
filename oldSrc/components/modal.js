import { ref, computed } from "vue/dist/vue.esm-bundler";
import { NModal, NScrollbar } from "naive-ui";

export const modal = {
  components:  {
    NModal,
    NScrollbar
  },
  props: {
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
    return {
      bodyStyle: {
        maxWidth: '900px',
      },
      showModal
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
        <div style="padding: 12px 24px;">
          <slot />
        </div>
      </n-scrollbar>
    </n-modal>
  `,
}
