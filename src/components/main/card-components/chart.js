import {
    defineComponent,
    ref,
    onMounted,
    onUnmounted,
    computed,
    watch,
} from 'vue'
import { NSelect, NEmpty } from 'naive-ui'
import { useContentStore, useChartStore } from '@/stores/index'
import { storeToRefs } from 'pinia'

/**
 * @typedef {{dataset: { label: string, data: string }, parsed: { y: string }, dataIndex: number }} context
 */

import ChartDataLabels from 'chartjs-plugin-datalabels'

import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    CategoryScale,
    Legend,
    // @ts-ignore
} from 'chartjs'

Chart.register(
    CategoryScale,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
    ChartDataLabels
)

export default defineComponent({
    components: { NSelect, NEmpty },
    setup() {
        const contentStore = useContentStore()
        const { tabBy, acronyms, form, loading } = storeToRefs(contentStore)
        const chartStore = useChartStore()
        const { years, dataChart } = storeToRefs(chartStore)

        const formPopulated = computed(() => contentStore.selectsPopulated)

        const chartDefined = ref(true)

        /**
         * @param {HTMLElement} chart
         * @param {string} id
         * @returns {void | HTMLElement}
         */
        const getOrCreateLegendList = (chart, id) => {
            const legendContainer = document.getElementById(id)

            if (!legendContainer) {
                return
            }

            let listContainer = legendContainer.querySelector('ul')

            if (!listContainer) {
                listContainer = document.createElement('ul')
                listContainer.style.display = 'flex'
                listContainer.style.gap = '4px 12px'
                listContainer.style.flexDirection = 'row'
                listContainer.style.flexWrap = 'wrap'
                listContainer.style.margin = '0'
                listContainer.style.padding = '0'

                legendContainer.appendChild(listContainer)
            }

            return listContainer
        }

        /** @type {(label: string) => string} */
        const splitTextToChart = (label) => {
            let labelSplited = label.split(' ')
            let lastLabel = labelSplited[labelSplited.length - 1]
            const vaccineName = labelSplited
                .slice(0, labelSplited.length - 1)
                .join(' ')
            const acronym =
                tabBy.value === 'immunizers'
                    ? acronyms.value.find((acronym) =>
                          vaccineName.includes(acronym['nome_vacinabr'])
                      )
                    : undefined
            let labelAcronym = acronym
                ? acronym['sigla_vacinabr']
                : labelSplited[0].substr(0, 3) + '.'

            if (form.value.granularity.toLowerCase() === 'municípios') {
                labelSplited = label.split(',')
                lastLabel =
                    ' ' +
                    labelSplited[1] +
                    ', ' +
                    labelSplited[2].substr(0, 6) +
                    '.'
            } else if (label.includes(',')) {
                labelSplited = label.split(',')
                lastLabel =
                    labelSplited[1].split(' ')[0] +
                    ' ' +
                    labelSplited[1].split(' ')[2].substr(0, 3)
            }
            return `${labelAcronym} ${lastLabel}`
        }

        /** @type {(value: string, context: { dataIndex: number, dataset: { label: string, data: string } }, signal: string) => string | null} */
        const formatter = (value, context, signal) => {
            const dataset = context.dataset.data
            // Get last populated year data index from dataset
            let count = 1
            while (dataset[dataset.length - count] === null) {
                count++
            }
            if (context.dataIndex === dataset.length - count) {
                const label = splitTextToChart(context.dataset.label)
                // @ts-ignore
                return signal
                    ? `${label} ${value}${signal}`
                    : `${label} ${Number(value).toLocaleString('pt-BR')}`
            }

            return null
        }

        /** @type {{ id: string, afterUpdate: (chart: Chart, args: any, options: { containerID: string}) => void}} */
        const htmlLegendPlugin = {
            id: 'htmlLegend',
            afterUpdate(chart, args, options) {
                if (!document.getElementById(options.containerID)) {
                    return
                }
                const ul = getOrCreateLegendList(chart, options.containerID)

                if (!ul) {
                    return
                }

                // Remove old legend items
                while (ul.firstChild) {
                    ul.firstChild.remove()
                }

                // Reuse the built-in legendItems generator
                const items =
                    /** @type {{ [key: string]: string }[]}  */
                    (chart.options.plugins.legend.labels.generateLabels(chart))

                items.forEach((item) => {
                    const li = document.createElement('li')
                    li.style.alignItems = 'center'
                    li.style.display = 'flex'
                    li.style.cursor = 'pointer'
                    li.style.flexDirection = 'row'
                    li.style.opacity = item.hidden ? '30%' : '100%'
                    li.style.border = '1px solid #ddd'
                    li.style.padding = '2px 4px'
                    li.style.borderRadius = '3px'
                    li.title =
                        'Clique para' +
                        (item.hidden ? ' exibir ' : ' ocultar ') +
                        'dado no gráfico'

                    li.onclick = () => {
                        chart.setDatasetVisibility(
                            item.datasetIndex,
                            !chart.isDatasetVisible(item.datasetIndex)
                        )
                        chart.update()
                    }

                    if (!item.hidden) {
                        li.onmouseenter = () => {
                            li.style.borderColor = '#e96f5f'
                        }
                        li.onmouseleave = () => {
                            li.style.borderColor = '#ddd'
                        }
                    }

                    // Color box
                    const boxSpan = document.createElement('span')
                    boxSpan.style.background = item.hidden
                        ? 'gray'
                        : item.fillStyle
                    boxSpan.style.borderColor = item.strokeStyle
                    boxSpan.style.borderWidth = item.lineWidth + 'px'
                    boxSpan.style.display = 'inline-block'
                    boxSpan.style.borderRadius = '50%'
                    boxSpan.style.height = '14px'
                    boxSpan.style.marginRight = '4px'
                    boxSpan.style.width = '14px'

                    // Text
                    const textContainer = document.createElement('p')
                    textContainer.style.color = item.fontColor
                    textContainer.style.margin = '0'
                    textContainer.style.padding = '0'
                    textContainer.style.textDecoration = item.hidden
                        ? 'line-through'
                        : ''

                    const text = document.createTextNode(
                        splitTextToChart(item.text)
                    )
                    textContainer.appendChild(text)

                    li.appendChild(boxSpan)
                    li.appendChild(textContainer)
                    ul.appendChild(li)
                })
            },
        }

        /** @type {(context: { dataset:  { label: string }, parsed: { y: string } }, signal: string) => string } */
        const formatterTooltip = (context, signal) => {
            let label = context.dataset.label || ''
            if (label.includes(',')) {
                let resultNewLabel = /** @type {string[]} */ (label.split(','))
                const resultNewLabelSplited = /** @type {string} */ (
                    resultNewLabel.shift()
                )
                // Extract first value remove region code
                const sickName = resultNewLabelSplited.split(' ')[0]
                resultNewLabel.pop()
                label = sickName + ' ' + resultNewLabel.join(', ')
            }

            label += ': '

            if (context.parsed.y !== null) {
                label += signal
                    ? context.parsed.y + signal
                    : Number(context.parsed.y).toLocaleString('pt-BR')
            }

            return label
        }

        /** @type {(value: string, signal: string|null) => string} */
        const chartTicks = (value, signal = null) => {
            return signal
                ? String(value) + signal
                : Number(value).toLocaleString('pt-BR')
        }

        let chart = /** @type {Chart | null} */ (null)

        /**
         * @param {string[] | null} labels
         * @param {{ label: string,
         *  data: (string | null)[],
         *  backgroundColor: string,
         *  borderColor: string,
         *  borderWidth: number,
         * }[]|null} datasets
         */
        const renderChart = (labels, datasets) => {
            if (!labels || !datasets || !formPopulated.value) {
                const legend = document.querySelector('#legend-container')
                if (legend) {
                    legend.innerHTML = ''
                }
                chartDefined.value = false
                return
            }

            chartDefined.value = true

            let signal = ''
            if (form.value.type !== 'Doses aplicadas') {
                signal = '%'
                for (const dataset of datasets) {
                    dataset.data = dataset.data.map((number) => {
                        return Number(number).toFixed(2)
                    })
                }
            } else {
                for (const dataset of datasets) {
                    dataset.data = dataset.data.map((number) => {
                        return number
                            ? String(number).replace(/\./g, '')
                            : number
                    })
                }
            }

            if (chart) {
                chart.data.labels = labels
                chart.data.datasets = datasets
                chart.options.scales.y.ticks.callback =
                    /** @type{(value: string) => any} */ (value) =>
                        chartTicks(value, signal)
                chart.options.plugins.datalabels.formatter =
                    /** @type{(value: string, context: context) => any} */ (
                        value,
                        context
                    ) => formatter(value, context, signal)
                chart.options.plugins.tooltip.callbacks.label =
                    /** @type{(context: context) => any} */ (context) =>
                        formatterTooltip(context, signal)
                chart.update()
                return
            }
            const plugin = {
                id: 'customCanvasBackgroundColor',
                /** @type {(chart: Chart, args: string[], options: { color: string }) => void} */
                beforeDraw: (chart, args, options) => {
                    const { ctx } = chart
                    ctx.save()
                    ctx.globalCompositeOperation = 'destination-over'
                    ctx.fillStyle = options.color || 'white'
                    ctx.fillRect(0, 0, chart.width, chart.height)
                    ctx.restore()
                },
            }
            try {
                const chartElement = /** @type {Chart} */ (
                    document.querySelector('#chart')
                )
                const ctx = chartElement.getContext('2d')
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets,
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            animateRotate: true,
                            animateScale: true,
                        },
                        scales: {
                            x: {
                                border: {
                                    display: false,
                                },
                                grid: {
                                    color: 'rgba(127,127,127, .2)',
                                },
                                ticks: {
                                    color: 'rgba(127,127,127, 1)',
                                    padding: 20,
                                    font: {
                                        size: 14,
                                    },
                                },
                            },
                            y: {
                                suggestedMin: 0,
                                suggestedMax: 100,
                                border: {
                                    display: false,
                                },
                                grid: {
                                    color: 'rgba(127,127,127, .2)',
                                },
                                ticks: {
                                    callback:
                                        /** @type {(value: string) => string} */ (
                                            value
                                        ) => chartTicks(value, signal),
                                    color: 'rgba(127,127,127, 1)',
                                    padding: 20,
                                    font: {
                                        size: 14,
                                    },
                                },
                            },
                        },
                        plugins: {
                            htmlLegend: {
                                // ID of the container to put the legend in
                                containerID: 'legend-container',
                            },
                            legend: {
                                display: false,
                            },
                            datalabels: {
                                align: /** @type {(context: { dataset: { borderColor: string }}) => number} */ function (
                                    context
                                ) {
                                    return 5
                                },
                                borderRadius: '50',
                                padding: '3',
                                backgroundColor: 'rgba(255,255,255, 0.95)',
                                color: /** @type {(context: { dataset: { borderColor: string }}) => string} */ function (
                                    context
                                ) {
                                    return context.dataset.borderColor
                                },
                                font: {
                                    size: 10,
                                    weight: 'bold',
                                },
                                display: 'auto',
                                formatter:
                                    /** @type {(value: string, context: context, signal: string) => string|null} */ (
                                        value,
                                        context
                                    ) => formatter(value, context, signal),
                            },
                            tooltip: {
                                callbacks: {
                                    label: /** @type {(context: context) => string|null} */ (
                                        context
                                    ) => formatterTooltip(context, signal),
                                },
                            },
                        },
                        layout: {
                            padding: {
                                right: 150,
                            },
                        },
                    },
                    plugins: [htmlLegendPlugin, plugin],
                })
            } catch (e) {
                // Do nothing
            }
        }

        onMounted(async () => {
            await chartStore.setChartData()
            renderChart(years.value, dataChart.value)
        })

        onUnmounted(() => {
            chartStore.resetState()
        })

        watch(
            () => form.value,
            async (formValue) => {
                // Avoid render before tab changed to chart/tables
                if (Array.isArray(formValue.sickImmunizer)) {
                    await chartStore.setChartData()
                    renderChart(years.value, dataChart.value)
                }
            },
            { deep: true }
        )

        return {
            chartDefined,
            formPopulated,
            loading,
        }
    },
    template: `
      <section>
        <div id="legend-container" style="margin: 0px 64px; max-height: 70px; overflow-y: auto;" class="mct-scrollbar"></div>
        <div class="mct-canva mct-canva--chart">
          <canvas :class="chartDefined ? '' : 'element-hidden'" id="chart"></canvas>
          <n-empty
            v-if="!loading"
            :class="chartDefined ? 'element-hidden' : ''"
            :description="formPopulated ? 'Não existem dados para os filtros selecionados': 'Selecione os filtros desejados para iniciar a visualização dos dados'"
            style="justify-content: center; border: 1px solid #ccc; width: 100%; border-radius: .25rem"
          />
          <div v-else style="width: 100%"></div>
        </div>
      </section>
    `,
})
