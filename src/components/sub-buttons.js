import { ref, computed, onBeforeMount } from "vue/dist/vue.esm-bundler";
import { NButton, NIcon, NCard, NScrollbar, NTabs, NTabPane } from "naive-ui";
import { biBook, biListUl, biDownload, biShareFill, biFiletypeCsv, biGraphUp } from "../icons.js";
import { formatToTable, timestampToYear } from "../utils.js";
import { useStore } from "vuex";
import CsvWriterGen from "csvwritergen";
import sbim from "../assets/images/sbim.png";
import cc from "../assets/images/cc.png";
import riAlertLine from "../assets/images/ri-alert-line.svg";
import { modal as Modal } from "./modal.js";
import CanvasDownload from "../canvas-download.js";
import logo from "../assets/images/logo-vacinabr.svg";
import Abandono from "../assets/images/abandono.svg"
import Cobertura from "../assets/images/cobertura.svg"
import HomGeo from "../assets/images/hom_geo.svg"
import HomVac from "../assets/images/hom_vac.svg"

export const subButtons = {
  components:  {
    NButton,
    NIcon,
    NCard,
    NScrollbar,
    Modal,
    NTabs,
    NTabPane
  },
  setup() {
    const svg = ref(null);
    const chartPNG = ref(null);
    const chart = ref(null);
    const store = useStore();
    const showModal = ref(false);
    const showModalGloss = ref(false);
    const showModalVac = ref(false);
    const legend = ref(computed(() => store.state.content.legend));
    const csvAllDataLink = ref(computed(() => store.state.content.csvAllDataLink));

    const aboutVaccines = ref(computed(() => {
      const text = store.state.content.aboutVaccines;
      let result = [];
      // TODO: Links inside text should be clickable
      for (let [header, rows] of Object.entries(text["rows"])){
        let rowFomated = rows["Texto"].replace(/\n/gi, "<br>").replace(/\*\*(.*?)\*\*/gi, '<b>$1</b>') ;
        result.push({ header: rows["ABA"], content: rowFomated })
      }
      return result;
    }))

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

    const timer = (seconds) =>  {
      let time = seconds * 1000
      return new Promise(res => setTimeout(res, time))
    }

    const downloadPng = async () => {
      const svgElement = document.querySelector("#canvas>svg");
      const svgContent = new XMLSerializer().serializeToString(svgElement);

      // Convert SVG content to a data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const images = [
        { image: svgUrl, height: 650, width: 650 },
        { image: logo, posX: 5, posY: 642 },
      ]

      const type = store.state.content.form.type;
      let legendSvg;

      if (type === "Abandono") {
        legendSvg = Abandono;
      } else if (type === "Cobertura") {
        legendSvg = Cobertura;
      } else if (type === "Homogeneidade geográfica") {
        legendSvg = HomGeo;
      } else if (type === "Homogeneidade entre vacinas") {
        legendSvg = HomVac;
      }

      if (legendSvg && store.state.content.tab === "map") {
        images.push({ image: legendSvg, width: 293, height: 88, posX: 1080, posY: 622 });
      }
      const canvasDownload = new CanvasDownload(
        images,
        {
          title: store.getters['content/mainTitle'],
          subTitle: store.getters['content/subTitle'],
          source: store.state.content.legend + ".",
        }
      );
      await canvasDownload.download();
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

      const tableData = formatToTable(currentResult.data, currentResult.localNames, currentResult.metadata);

      const csvwriter = new CsvWriterGen(tableData.header.map(x => Object.values(x)[0]), tableData.rows.map(x => Object.values(x)));
      csvwriter.anchorElement('tabela');
    }

    const openInNewTab = () => {
      window.open(csvAllDataLink.value["url"], '_blank');
    }

    const clickShowVac = () => {
      showModalVac.value = !showModalVac.value;
    }

    const clickShowGloss = () => {
      showModalGloss.value = !showModalGloss.value;
    }

    const clickShowModal = () => {
      const map = document.querySelector("#canvas");
      svg.value = map?.innerHTML;
      const canvas = document.getElementById("chart");
      chartPNG.value = canvas && ![...canvas.classList].includes("element-hidden") ? canvas?.toDataURL('image/png', 1) : null;
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

    const downloadChartAsImage = async () => {
      const imageLink = document.createElement("a");
      imageLink.download = 'chart.png';
      if (!chartPNG.value) {
        store.commit('message/ERROR', "Preencha os seletores para gerar imagem")
        return;
      }

      const canvasDownload = new CanvasDownload(
        [
          { image: chartPNG.value },
          { image: logo, posX: 5, posY: 642 }
        ],
        {
          title: store.getters['content/mainTitle'],
          subTitle: store.getters['content/subTitle'],
          source: store.state.content.legend + ".",
        }
      );
      await canvasDownload.download();
    }

    const goToCCLink = () => {
      window.open('https://creativecommons.org/licenses/by/4.0/');
    }

    return {
      bodyStyle: {
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
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
      downloadCsvAll: openInNewTab,
      clickShowModal,
      svg,
      chart,
      legend,
      aboutVaccines,
      copyCurrentLink,
      sbim,
      cc,
      sendMail,
      riAlertLine,
      downloadChartAsImage,
      chartPNG,
      tab: computed(() => store.state.content.tab),
      goToCCLink,
      showModalGloss,
      clickShowGloss,
      showModalVac,
      clickShowVac,
      modalGlossary: computed(() => {
        const text = store.state.content.glossary["rows"];
        let result = "";
        // TODO: Links inside text should be clickable
        for (let val of text) {
          result += `<h2 style="margin-bottom: 12px">${val['ABA']}</h2><p>${val['Texto']}</p>`;
        }
        return result;
      })
    };
  },
  template: `
    <section>
      <div class="main-card-footer-container">
        <div class="main-card-footer">
          <span class="main-card-footer__legend">{{ legend }}</span>
          <div class="main-card-footer__buttons">
            <n-button quaternary type="primary" style="font-weight: 500" @click="clickShowVac">
              <template #icon><n-icon v-html="biBook" /></template>
              Sobre as vacinas
            </n-button>
            <n-button quaternary type="primary" style="font-weight: 500" @click="clickShowGloss">
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
            <n-button text type="primary" style="font-weight: 500" @click="clickShowVac">
              Sobre a vacina
            </n-button>
            <n-button text type="primary" style="font-weight: 500" @click="clickShowGloss">
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
      <modal
        v-model:show="showModalVac"
        title="Sobre as Vacinas"
      >
        <n-tabs type="line">
          <n-tab-pane v-for="item in aboutVaccines" :name="item.header" :tab="item.header">
            <n-scrollbar style="height: 55vh; line-height: 26px">
              <div style="padding: 12px 0px" v-html="item.content"></div>
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
      </modal>
      <modal
        v-model:show="showModalGloss"
        title="Glossário"
      >
        <div v-html="modalGlossary"></div>
      </modal>
      <modal
        v-model:show="showModal"
        title="Download"
      >
        <div style="margin: 0px 0px 12px"> Faça o download de conteúdos</div>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <template v-if="tab === 'map'">
            <div style="padding: 0px 0px 12px;">Mapas</div>
            <n-card embedded :bordered="false">
              <div style="display: flex; align-items: center; justify; justify-content: space-between;">
                <div style="display: flex; gap: 12px">
                  <div v-html="svg" style="max-width: 100px"></div>
                  <div style="font-size: 1rem">
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
            <n-card v-if="tab === 'map'" embedded :bordered="false">
              <div style="display: flex; align-items: center; justify; justify-content: space-between;">
                <div style="display: flex; gap: 12px">
                  <div v-html="svg" style="max-width: 100px"></div>
                  <div style="font-size: 1rem">
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
          </template>
          <template v-if="tab === 'chart'">
            <div style="padding: 0px 0px 12px;">Gráficos</div>
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
                  <div style="font-size: 1rem">
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
          </template>
        </div>
        <div style="padding: 14px 0px 12px; gap: 12px">Dados</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
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
                  <p>Todos os dados por município da plataforma vacinaBR</p>
                </div>
              </div>
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadCsvAll">
                <template #icon><n-icon v-html="biDownload" /></template>
                &nbsp;&nbsp;Baixar
              </n-button>
            </div>
          </n-card>
        </div>
        <div style="display: flex; justify-content: end; margin-top: 12px">
          <div>Licença:</div>
          <div style="margin: 4px 12px 0px; cursor: pointer" :onClick="goToCCLink" title="Atribuição 4.0 Internacional (CC BY 4.0)">
            <img :src="cc" width="100" >
          </div>
        </div>
      </modal>
    </section>
  `,
}
