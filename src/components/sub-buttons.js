import { ref } from "vue/dist/vue.esm-bundler";
import { NButton, NIcon, NModal } from "naive-ui";
import { biBook, biListUl, biDownload, biShareFill } from "../icons.js";

export const subButtons = {
  components:  {
    NButton,
    NIcon,
    NModal
  },
  setup() {
    return {
      bodyStyle: {
        width: '600px'
      },
      segmented: {
        content: 'soft',
        footer: 'soft'
      },
      showModal: ref(false),
      biBook,
      biListUl,
      biDownload,
      biShareFill
    };
  },
  props: {
    api: {
      type: String,
    },
  },
  template: `
    <section class="main-card-footer">
      <span class="main-card-footer__legend">Fonte: Programa Nacional de imunização (PNI), disponibilizadas no TabNet-DATASUS</span>
      <div class="main-card-footer__buttons">
        <n-button quaternary type="primary" style="font-weight: 500">
          <template #icon><n-icon v-html="biBook" /></template>
          Sobre a vacina
        </n-button>
        <n-button quaternary type="primary" style="font-weight: 500">
          <template #icon><n-icon v-html="biListUl" /></template>
          Glossário
        </n-button>
        <n-button quaternary type="primary" style="font-weight: 500" @click="showModal = true">
          <template #icon><n-icon v-html="biDownload" /></template>
          Download
        </n-button>
        <n-button quaternary type="primary" style="font-weight: 500">
          <template #icon><n-icon v-html="biShareFill" /></template>
          Compartilhar
        </n-button>
      </div>
      <n-modal
        v-model:show="showModal"
        class="custom-card"
        preset="card"
        :style="bodyStyle"
        title="Modal"
        :bordered="false"
        size="large"
        :segmented="segmented"
      >
        <template #header-extra>Content extra.</template>
        Content
        <template #footer>Footer</template>
      </n-modal>
    </section>
  `,
}
