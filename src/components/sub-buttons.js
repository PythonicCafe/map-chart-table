import { ref, computed } from "vue/dist/vue.esm-bundler";
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
      const canvasDownload = new CanvasDownload(
        images,
        {
          title: store.getters['content/mainTitle'],
          subTitle: store.getters['content/subTitle'],
          message: "Em elaboração: versão beta para testes.",
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
      const csvwriter = new CsvWriterGen(currentResult.data.shift(), currentResult.data);
      csvwriter.anchorElement('tabela');
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
          message: "Em elaboração: versão beta para testes."
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
      clickShowModal,
      svg,
      chart,
      legend,
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
      clickShowVac
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
          <n-tab-pane name="oasis" tab="Lorem ipsum">
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Dui faucibus in ornare quam viverra. Pulvinar pellentesque habitant morbi tristique senectus et netus et malesuada. Euismod lacinia at quis risus sed vulputate odio. Tortor vitae purus faucibus ornare suspendisse. Sit amet mauris commodo quis. Tempor nec feugiat nisl pretium. Amet consectetur adipiscing elit ut aliquam purus. Natoque penatibus et magnis dis parturient montes nascetur ridiculus. Elementum eu facilisis sed odio morbi quis. Maecenas accumsan lacus vel facilisis volutpat est velit. Sit amet mattis vulputate enim nulla aliquet porttitor lacus luctus. Mi sit amet mauris commodo quis imperdiet massa. Rhoncus est pellentesque elit ullamcorper dignissim cras. Sagittis id consectetur purus ut. Augue mauris augue neque gravida. Vitae suscipit tellus mauris a. Maecenas sed enim ut sem viverra aliquet eget. Lectus nulla at volutpat diam ut.
          </n-tab-pane>
          <n-tab-pane name="the beatles" tab="Sed ullamcorper">
Sed ullamcorper morbi tincidunt ornare massa eget. A erat nam at lectus urna duis convallis convallis. Justo laoreet sit amet cursus sit amet. Sodales ut etiam sit amet nisl purus in. Bibendum neque egestas congue quisque egestas diam in. Metus dictum at tempor commodo ullamcorper a. Eget sit amet tellus cras adipiscing enim eu turpis. In metus vulputate eu scelerisque felis imperdiet proin fermentum. Neque laoreet suspendisse interdum consectetur. Lacus viverra vitae congue eu consequat ac felis donec. Ante metus dictum at tempor commodo ullamcorper a. Faucibus purus in massa tempor. Nulla pellentesque dignissim enim sit amet venenatis urna cursus. Mauris cursus mattis molestie a iaculis at erat pellentesque. At ultrices mi tempus imperdiet.
          </n-tab-pane>
          <n-tab-pane name="jay chou" tab="A erat nam">
A erat nam at lectus urna duis convallis convallis tellus. Cursus risus at ultrices mi. Morbi leo urna molestie at elementum eu facilisis. Imperdiet sed euismod nisi porta lorem mollis aliquam ut. Porttitor rhoncus dolor purus non enim. Placerat in egestas erat imperdiet sed. Egestas erat imperdiet sed euismod. Neque ornare aenean euismod elementum nisi quis eleifend quam. Eget nulla facilisi etiam dignissim diam quis enim lobortis scelerisque. Felis eget nunc lobortis mattis aliquam faucibus purus in massa. Sed viverra ipsum nunc aliquet bibendum enim facilisis. Auctor urna nunc id cursus metus aliquam eleifend.
          </n-tab-pane>
        </n-tabs>
      </modal>
      <modal
        v-model:show="showModalGloss"
        title="Glossário"
      >
        <h2>Lorem ipsum dolor sit amet</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Dui faucibus in ornare quam viverra. Pulvinar pellentesque habitant morbi tristique senectus et netus et malesuada. Euismod lacinia at quis risus sed vulputate odio. Tortor vitae purus faucibus ornare suspendisse. Sit amet mauris commodo quis. Tempor nec feugiat nisl pretium. Amet consectetur adipiscing elit ut aliquam purus. Natoque penatibus et magnis dis parturient montes nascetur ridiculus. Elementum eu facilisis sed odio morbi quis. Maecenas accumsan lacus vel facilisis volutpat est velit. Sit amet mattis vulputate enim nulla aliquet porttitor lacus luctus. Mi sit amet mauris commodo quis imperdiet massa. Rhoncus est pellentesque elit ullamcorper dignissim cras. Sagittis id consectetur purus ut. Augue mauris augue neque gravida. Vitae suscipit tellus mauris a. Maecenas sed enim ut sem viverra aliquet eget. Lectus nulla at volutpat diam ut.</p>
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
              <n-button quaternary type="primary" style="font-weight: 500" @click="downloadCsv">
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
