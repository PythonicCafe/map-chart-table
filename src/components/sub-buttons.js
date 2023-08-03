import { ref, onMounted } from "vue/dist/vue.esm-bundler";
import { NButton, NIcon, NModal, NCard } from "naive-ui";
import { biBook, biListUl, biDownload, biShareFill, biFiletypeCsv } from "../icons.js";

export const subButtons = {
  components:  {
    NButton,
    NIcon,
    NModal,
    NCard
  },
  setup() {
    const svg = ref(null);
    const showModal = ref(false);
    const downloadSVG = () => {
      const svgData = document.querySelector("#canvas").innerHTML;
      const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = "mapa.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    const downloadPNG = () => {
      const svgData = document.querySelector("#canvas>svg");
      const serializedSVG = new XMLSerializer().serializeToString(svgData);
      const svgDataBase64 = "data:image/svg+xml;base64," + window.btoa(serializedSVG)

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const width = 600;
      const height = 600;

      canvas.width = width;
      canvas.height = height;

      const image = new Image();

      image.addEventListener('load', () => {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const pngData = canvas.toDataURL('image/png');

        // Generating download link and clicking
        const anchorElement = document.createElement('a');
        anchorElement.href = pngData;
        anchorElement.download = "map.png";

        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
      })

      image.src = svgDataBase64;
    }
    const clickShowModal = () => {
      const map = document.querySelector("#canvas");
      svg.value = map?.innerHTML;
      showModal.value = true;
    }
    return {
      bodyStyle: {
        maxWidth: '900px',
      },
      showModal,
      biBook,
      biListUl,
      biDownload,
      biShareFill,
      biFiletypeCsv,
      downloadSVG,
      downloadPNG,
      clickShowModal,
      svg
    };
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
        <n-button quaternary type="primary" style="font-weight: 500" @click="clickShowModal">
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
        title="Download"
        :bordered="false"
        size="huge"
      >
        Faça o download de conteúdos<br><br>

        <div v-if="svg">
          Gráficos
          <n-card embedded :bordered="false">
            <div style="display: flex; align-items: center; justify; justify-content: space-between;">
              <div style="display: flex; gap: 12px">
                <div v-html="svg" style="max-width: 100px"></div>
                <div>
                  <h3>Imagem PNG</h3>
                  <p>Adequado para a maioria dos usos, amplamento compatível</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadPNG">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
          <n-card embedded :bordered="false">
            <div style="display: flex; align-items: center; justify; justify-content: space-between;">
              <div style="display: flex; gap: 12px">
                <div v-html="svg" style="max-width: 100px"></div>
                <div>
                  <h3>Imagem SVG</h3>
                  <p>Para impressões de alta qualidade e editável em softwares gráficos</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadSVG">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
        </div>

        Dados
        <n-card embedded :bordered="false">
          <div style="display: flex; align-items: center; justify; justify-content: space-between;">
            <div style="display: flex; gap: 12px; align-items: center">
              <div style="padding: 0px 24px">
                <n-icon v-html="biFiletypeCsv" size="50" />
              </div>
              <div>
                <h3>Dados completos em CSV</h3>
                <p>Os dados completos para você usar nos seus gráficos</p>
              </div>
            </div>
            <n-button quaternary type="primary" style="font-weight: 500" @click="downloadPNG">
              <template #icon><n-icon v-html="biDownload" /></template>
              &nbsp;&nbsp;Baixar
            </n-button>
          </div>
        </n-card>
      </n-modal>
    </section>
  `,
}
