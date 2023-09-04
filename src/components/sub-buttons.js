import { ref, computed } from "vue/dist/vue.esm-bundler";
import { NButton, NIcon, NModal, NCard } from "naive-ui";
import { biBook, biListUl, biDownload, biShareFill, biFiletypeCsv, biGraphUp } from "../icons.js";
import { formatToTable, timestampToYear } from "../utils.js";
import { useStore } from "vuex";
import CsvWriterGen from "csvwritergen";
import sbim from "../assets/images/sbim.png"
import riAlertLine from "../assets/images/ri-alert-line.svg"

export const subButtons = {
  components:  {
    NButton,
    NIcon,
    NModal,
    NCard
  },
  setup() {
    const svg = ref(null);
    const chartPNG = ref(null);
    const chart = ref(null);
    const store = useStore();
    const showModal = ref(false);
    const legend = ref(computed(() => store.state.content.legend));
    const downloadSvg = () => {
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
    const downloadPng = () => {
      const svgData = document.querySelector("#canvas>svg");
      const serializedSVG = new XMLSerializer().serializeToString(svgData);
      const svgDataBase64 = "data:image/svg+xml;base64," + window.btoa(serializedSVG);
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

    const downloadCsv = async () => {
      const periodStart = store.state.content.form.periodStart;
      const periodEnd = store.state.content.form.periodEnd;
      let years = [];
      if (periodStart) {
        let y =  periodStart;
        while (y <= periodEnd) {
          years.push(y++);
        }
      }

      const currentResult = await store.dispatch("content/requestData", { detail: true });
      if (!currentResult) {
        store.commit('message/ERROR', "Preencha os seletores para gerar csv")
        return;
      }
      const csvwriter = new CsvWriterGen(currentResult.data.shift(), currentResult.data);
      csvwriter.anchorElement('tabela');
    }

    const clickShowModal = () => {
      const map = document.querySelector("#canvas");
      svg.value = map?.innerHTML;
      const canvas = document.getElementById("chart");
      chartPNG.value = ![...canvas.classList].includes("element-hidden") ? canvas?.toDataURL('image/png', 1) : null; 
      showModal.value = true;
    }

    const copyCurrentLink = () => {
      navigator.clipboard.writeText(window.location.href);
      store.commit('message/SUCCESS', "Link copiado para o seu clipboard");
    }

    const sendMail = () => {
      document.location.href =
        "mailto:vacinabr@iqc.org.br?subject=Erro no VacinaBR&body=Sua Mensagem";
    }

    const downloadChartAsImage = () => {
      const imageLink = document.createElement("a");
      imageLink.download = 'chart.png';
      if (!chartPNG.value) {
        store.commit('message/ERROR', "Preencha os seletores para gerar imagem")
        return;
      }  
      imageLink.href = chartPNG.value;
      imageLink.click();
    }

    return {
      bodyStyle: {
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'scroll',
      },
      showModal,
      biBook,
      biListUl,
      biDownload,
      biShareFill,
      biFiletypeCsv,
      biGraphUp,
      downloadSvg,
      downloadPng,
      downloadCsv,
      clickShowModal,
      svg,
      chart,
      legend,
      copyCurrentLink,
      sbim,
      sendMail,
      riAlertLine,
      downloadChartAsImage,
      chartPNG
    };
  },
  template: `
    <section>
      <div class="main-card-footer-container">
        <div class="main-card-footer">
          <span class="main-card-footer__legend">{{ legend }}</span>
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
            <n-button quaternary type="primary" style="font-weight: 500" @click="copyCurrentLink">
              <template #icon><n-icon v-html="biShareFill" /></template>
              Compartilhar
            </n-button>
          </div>
        </div>
        <div class="main-card-footer">
          <div style="display: flex; gap: 12px">
            <div class="main-card-footer__legend">Apoio: </div>
            <img :src="sbim" width="100" >
          </div>
          <div
            style="background-color: #f7f7f7; padding: 6px 12px; border-radius: .23rem; display: flex; align-items: center; gap: 8px"
          >
            <img :src="riAlertLine">
            Achou um erro? Escreva para
            <n-button type="primary" text :onClick="sendMail">vacinabr@iqc.org.br</n-button>
          </div>
        </div>
      </div>
      <div class="main-card-footer-container-mobile">
        <div class="main-card-footer main-card-footer--mobile">
          <div class="main-card-footer__buttons main-card-footer__buttons--mobile">
            <n-button text type="primary" style="font-weight: 500">
              Sobre a vacina
            </n-button>
            <n-button text type="primary" style="font-weight: 500">
              Glossário
            </n-button>
            <n-button text type="primary" style="font-weight: 500" @click="clickShowModal">
              Download
            </n-button>
            <n-button text type="primary" style="font-weight: 500" @click="copyCurrentLink">
              Compartilhar
            </n-button>
          </div>
          <div style="display: flex; gap: 12px;">
            <div class="main-card-footer__legend">Apoio: </div>
            <img :src="sbim" width="100" >
          </div>
        </div>
        <div class="main-card-footer main-card-footer--mobile">
          <span class="main-card-footer__legend">{{ legend }}</span>
          <div
            style="background-color: #f7f7f7; padding: 6px 12px; border-radius: .23rem; display: flex; align-items: center; gap: 8px"
          >
            <img :src="riAlertLine">
            Achou um erro? Escreva para
            <n-button type="primary" text :onClick="sendMail">vacinabr@iqc.org.br</n-button>
          </div>
        </div>
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

        <div style="display: flex; flex-direction: column; gap: 12px">
          <div style="padding: 0px 0px 12px;">Gráficos</div>
          <n-card v-if="svg" embedded :bordered="false">
            <div style="display: flex; align-items: center; justify; justify-content: space-between;">
              <div style="display: flex; gap: 12px">
                <div v-html="svg" style="max-width: 100px"></div>
                <div>
                  <h3>Imagem PNG</h3>
                  <p>Adequado para a maioria dos usos, amplamente compatível</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadPng">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
          <n-card v-if="svg" embedded :bordered="false">
            <div style="display: flex; align-items: center; justify; justify-content: space-between;">
              <div style="display: flex; gap: 12px">
                <div v-html="svg" style="max-width: 100px"></div>
                <div>
                  <h3>Imagem SVG</h3>
                  <p>Para impressões de alta qualidade e editável em softwares gráficos</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadSvg">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
          <n-card embedded :bordered="false">
            <div style="display: flex; align-items: center; justify; justify-content: space-between;">
              <div style="display: flex; gap: 12px; align-items: center">
                <img
                  v-if="chartPNG"
                  :src="chartPNG"
                  style="max-width: 100px;
                  background-color: white;
                  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;"
                />
                <div v-else style="padding: 0px 24px">
                  <n-icon v-html="biGraphUp" size="50" />
                </div>
                <div>
                  <h3>Gráfico PNG</h3>
                  <p>Para impressões de alta qualidade e editável em softwares gráficos</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadChartAsImage">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
        </div>
        <div style="padding: 14px 0px 12px; gap: 12px">Dados</div>
        <n-card embedded :bordered="false">
          <div style="display: flex; align-items: center; justify; justify-content: space-between;">
            <div style="display: flex; gap: 12px; align-items: center">
              <div style="padding: 0px 24px">
                <n-icon v-html="biFiletypeCsv" size="50" />
              </div>
              <div>
                <h3>Dados utilizados na interface em CSV</h3>
                <p>Os dados que estão sendo utilizados nesta interface</p>
              </div>
            </div>
            <n-button quaternary type="primary" style="font-weight: 500" @click="downloadCsv">
              <template #icon><n-icon v-html="biDownload" /></template>
              &nbsp;&nbsp;Baixar
            </n-button>
          </div>
        </n-card>
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
            <n-button quaternary type="primary" style="font-weight: 500" @click="downloadCsv">
              <template #icon><n-icon v-html="biDownload" /></template>
              &nbsp;&nbsp;Baixar
            </n-button>
          </div>
        </n-card>
      </n-modal>
    </section>
  `,
}
