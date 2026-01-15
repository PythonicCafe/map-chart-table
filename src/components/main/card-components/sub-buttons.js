import { NButton, NIcon, NCard, NScrollbar, NTabs, NTabPane } from 'naive-ui'
import { defineComponent, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useContentStore, useMessageStore } from '@/stores'
import CanvasDownload from '@/canvas-download'

//@ts-ignore
import CsvWriterGen from 'csvwritergen'

import { formatToTable, formatDatePtBr } from '@/utils'

import {
    biBook,
    biListUl,
    biDownload,
    biShareFill,
    biFiletypeCsv,
    biGraphUp,
} from '@/icons'

import sbim from '@/assets/images/sbim.png'
import cc from '@/assets/images/cc.png'
import riAlertLine from '@/assets/images/ri-alert-line.svg'

import ModalGeneric from '@/components/main/modal/modal-generic'
import ModalGenericWithTabs from '@/components/main/modal/modal-genetic-with-tabs'

import Abandono from '@/assets/images/abandono.svg'
import Cobertura from '@/assets/images/cobertura.svg'
import HomGeo from '@/assets/images/hom_geo.svg'
import HomVac from '@/assets/images/hom_vac.svg'
import Meta from '@/assets/images/meta.svg'
import logo from '@/assets/images/logo-vacinabr.svg'

export default defineComponent({
    components: {
        NButton,
        NCard,
        NIcon,
        NScrollbar,
        NTabPane,
        NTabs,
        ModalGeneric,
        ModalGenericWithTabs,
    },
    setup() {
        const messageStore = useMessageStore()
        const contentStore = useContentStore()

        const {
            csvAllDataLink,
            csvRowsExceeded,
            maxCsvExportRows,
            selectsEmpty,
            selectsPopulated,
            aboutVaccines,
            lastUpdateDate,
            form,
            tab,
            mainTitle,
            subTitle,
            legend,
        } = storeToRefs(contentStore)

        /** @type import('vue').Ref */
        const svg = ref(null)
        /** @type import('vue').Ref */
        const chartPNG = ref(null)
        /** @type import('vue').Ref */
        const chart = ref(null)

        /** @type import('vue').Ref */
        const showModal = ref(false)
        /** @type import('vue').Ref */
        const showModalVac = ref(false)
        /** @type import('vue').Ref */
        const loadingDownload = ref(false)

        const clickShowModal = () => {
            const map = document.querySelector('#canvas')
            svg.value = map?.innerHTML
            const canvas = /** @type{any} */ (document.getElementById('chart'))
            chartPNG.value =
                canvas && ![...canvas.classList].includes('element-hidden')
                    ? canvas?.toDataURL('image/png', 1)
                    : null
            showModal.value = true
        }

        const aboutVaccinesContent = computed(() => {
            const text = aboutVaccines.value
            if (!text || !text.length) {
                return
            }
            const div = document.createElement('div')
            div.innerHTML = text[0].content.rendered
            const result = [...div.querySelectorAll('table>tbody>tr')].map(
                (tr) => {
                    return {
                        header: tr.querySelectorAll('td')[0].innerHTML,
                        content: tr.querySelectorAll('td')[1].innerHTML,
                    }
                }
            )
            return result
        })

        const clickShowVac = () => {
            showModalVac.value = !showModalVac.value
        }

        const copyCurrentLink = () => {
            navigator.clipboard.writeText(window.location.href)
            messageStore.message('success', 'Link copiado para o seu clipboard')
        }

        const sendMail = () => {
            document.location.href =
                'mailto:vacinabr@iqc.org.br?subject=Erro no VacinaBR&body=Sua Mensagem'
        }

        const downloadCsv = async () => {
            loadingDownload.value = true
            const periodStart = form.value.periodStart
            const periodEnd = form.value.periodEnd
            let years = []
            if (periodStart && periodEnd) {
                let y = Number(periodStart)
                while (y <= Number(periodEnd)) {
                    years.push(y++)
                }
            }

            const currentResult = /** @type{any} */ (
                await contentStore.requestData({ detail: true, csv: true })
            )

            if (currentResult && currentResult.aborted) {
                return
            }
            if (currentResult && currentResult.error) {
                loadingDownload.value = false
            }

            if (!currentResult) {
                messageStore.message(
                    'error',
                    'Preencha os seletores de filtro para gerar csv'
                )
                loadingDownload.value = false
                return
            }
            // GA Event
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('event', 'file_download', {
                    file_extension: 'csv',
                    link_text: 'Dados utilizados na interface em CSV',
                    file_name: 'tabela.csv',
                })
            }

            const tableData = formatToTable(
                currentResult.result.data,
                currentResult.localNames,
                currentResult.metadata
            )

            const header = tableData.header.map((x) => Object.values(x)[0])
            const type = form.value.type
            header[header.findIndex((head) => head === 'Valor')] = type
            const rows = tableData.rows.map((x) => Object.values(x))
            if (type === 'Doses aplicadas') {
                const index = header.findIndex(
                    (column) => column === 'Doses(qtd)'
                )
                header.splice(index, 1)
                rows.forEach((row) => row.splice(index, 1))
            }

            //  Fix header position in csv result
            if (header.length > 7) {
                header.splice(6, 0, header.splice(7, 1)[0])
            } else {
                header.splice(5, 0, header.splice(6, 1)[0])
            }

            const csvwriter = new CsvWriterGen(header, rows)
            csvwriter.anchorElement('tabela')
            loadingDownload.value = false
        }

        const goToCCLink = () => {
            window.open('https://creativecommons.org/licenses/by/4.0/')
        }

        const downloadPng = async () => {
            // GA Event
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('event', 'file_download', {
                    file_extension: 'png',
                    link_text: 'Mapa PNG',
                    file_name: 'mapa.png',
                })
            }

            if (!selectsPopulated.value) {
                messageStore.message(
                    'error',
                    'Preencha os seletores de filtro para gerar mapa'
                )
                return
            }

            const svgElement = /** @type{Element} */ (
                document.querySelector('#canvas>svg')
            )
            const svgContent = new XMLSerializer().serializeToString(svgElement)

            // Convert SVG content to a data URL
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
            const svgUrl = URL.createObjectURL(svgBlob)

            const images = [
                { image: svgUrl, height: 650, width: 650 },
                { image: logo, height: 53, width: 218, posX: 5, posY: 642 },
            ]

            const type = form.value.type
            let legendSvg

            if (type === 'Abandono') {
                legendSvg = Abandono
            } else if (type === 'Cobertura') {
                legendSvg = Cobertura
            } else if (type === 'Homogeneidade geográfica') {
                legendSvg = HomGeo
            } else if (type === 'Homogeneidade entre vacinas') {
                legendSvg = HomVac
            } else if (type === 'Meta atingida') {
                legendSvg = Meta
            }

            if (legendSvg && tab.value === 'map') {
                images.push({
                    image: legendSvg,
                    width: 293,
                    height: 88,
                    posX: 1080,
                    posY: 622,
                })
            }
            const canvasDownload = new CanvasDownload(images, {
                title: mainTitle.value,
                subTitle: subTitle.value,
                source: legend + '.',
            })
            await canvasDownload.download()
        }

        const downloadSvg = () => {
            if (!selectsPopulated.value) {
                messageStore.message(
                    'error',
                    'Preencha os seletores de filtro para gerar mapa'
                )
                return
            }

            // GA Event
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('event', 'file_download', {
                    file_extension: 'svg',
                    link_text: 'Mapa SVG',
                    file_name: 'mapa.svg',
                })
            }

            const svgElement = /** @type{Element} */ (
                document.querySelector('#canvas')
            )
            const svgData = svgElement.innerHTML
            const svgBlob = new Blob([svgData], {
                type: 'image/svg+xml;charset=utf-8',
            })
            const svgUrl = URL.createObjectURL(svgBlob)
            const downloadLink = document.createElement('a')
            downloadLink.href = svgUrl
            downloadLink.download = 'mapa.svg'
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
        }

        const downloadCsvAll = () => {
            // GA Event
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('event', 'file_download', {
                    file_extension: 'zip',
                    link_text: 'Dados completos em CSV',
                    file_name: 'vacinabr.zip',
                    link_url: '/wp-content/uploads/vacinabr/vacinabr.zip',
                })
            }

            // @ts-ignore
            window.open(csvAllDataLink.value, '_blank')
        }

        const downloadChartAsImage = async () => {
            const imageLink = document.createElement('a')
            imageLink.download = 'chart.png'
            if (!chartPNG.value) {
                messageStore.message(
                    'error',
                    'Preencha os seletores de filtro para gerar imagem'
                )
                return
            }
            // GA Event
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('event', 'file_download', {
                    file_extension: 'png',
                    link_text: 'Chart PNG',
                    file_name: 'image.png',
                })
            }

            const canvasDownload = new CanvasDownload(
                [
                    { image: chartPNG.value },
                    { image: logo, height: 53, width: 218, posX: 5, posY: 842 },
                ],
                {
                    title: mainTitle.value,
                    subTitle: subTitle.value,
                    source: legend.value + '.',
                    canvasHeight: 900,
                    yTextSource: 894,
                }
            )
            await canvasDownload.download()
        }

        return {
            aboutVaccinesContent,
            biBook,
            biDownload,
            biFiletypeCsv,
            biGraphUp,
            biListUl,
            biShareFill,
            cc,
            clickShowModal,
            clickShowVac,
            copyCurrentLink,
            csvRowsExceeded,
            downloadCsv,
            downloadPng,
            formatDatePtBr,
            goToCCLink,
            lastUpdateDate,
            legend,
            loadingDownload,
            maxCsvExportRows,
            riAlertLine,
            sbim,
            selectsEmpty,
            sendMail,
            showModal,
            showModalVac,
            svg,
            tab,
            downloadSvg,
            downloadCsvAll,
            downloadChartAsImage,
            chartPNG,
        }
    },
    template: `
    <section>
      <div class="main-card-footer-container">
        <div class="main-card-footer">
          <span class="main-card-footer__legend">{{ legend }}</span>
          <div class="main-card-footer__buttons">
            <n-button
              v-if="aboutVaccinesContent && aboutVaccinesContent.length"
              quaternary
              type="primary"
              style="font-weight: 500"
              @click="clickShowVac"
            >
              <template #icon><n-icon v-html="biBook" /></template>
              Sobre as vacinas
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
        <div v-if="lastUpdateDate" class="main-card-footer-dates">
          <div v-if="lastUpdateDate.data" style="display: flex; gap: 12px">
            <div class="main-card-footer__legend">Dados coletados em: </div>
            <span>{{ formatDatePtBr(lastUpdateDate.data) }}</span>
          </div>
          <div v-if="lastUpdateDate.platform" style="display: flex; gap: 12px">
            <div class="main-card-footer__legend">Última atualização da plataforma: </div>
            <span>{{ formatDatePtBr(lastUpdateDate.platform) }}</span>
          </div>
        </div>
      </div>
      <modal-generic-with-tabs
        v-model:show="showModalVac"
        title="Sobre as Vacinas"
        :modalContent="aboutVaccinesContent"
      />
      <modal-generic
        v-model:show="showModal"
        title="Download"
        :mask-closable="!loadingDownload"
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
              <n-button
                quaternary type="primary"
                style="font-weight: 500"
                @click="downloadCsv"
                :disabled="tab === 'table' && csvRowsExceeded && !loadingDownload"
                :title="csvRowsExceeded ? 'Excedido limite máximo de ' + maxCsvExportRows.toLocaleString('pt-BR') + ' linhas para download de dados contidos na interface' : ''"
                :loading="loadingDownload"
              >
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
      </modal-generic>
    </section>
  `,
})
