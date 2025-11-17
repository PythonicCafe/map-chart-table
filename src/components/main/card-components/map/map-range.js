import { defineComponent, ref, watch } from 'vue'

import { NCard } from 'naive-ui'

import { useContentStore, useMapStore } from '@/stores/index'
import { storeToRefs } from 'pinia'

export default defineComponent({
    components: {
        NCard,
    },
    setup() {
        const contentStore = useContentStore()
        const { form } = storeToRefs(contentStore)

        const mapStore = useMapStore()
        const { mapData, mapTooltip } = storeToRefs(mapStore)

        /**
         * @type {import('vue').Ref<any>}
         */
        const datasetValues = ref([])

        /**
         * @type {import('vue').Ref<SVGSVGElement | null>}
         */
        const mapRangeSVG = ref(null)

        /**
         * @type {import('vue').Ref<string>}
         */
        const maxVal = ref('---')

        /**
         * @type {import('vue').Ref<string>}
         */
        const minVal = ref('--')

        /**
         * Draws a line in an SVG element.
         * @param {SVGSVGElement} svg - The SVG element to draw the line in.
         */
        const drawLine = (svg) => {
            svg.setAttribute('height', '0')
            const offsetHeight = svg?.parentElement?.offsetHeight ?? 0
            svg.setAttribute('height', String(offsetHeight - 70))
            const line = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'line'
            )
            line.setAttribute('x1', '20')
            line.setAttribute('y1', '0')
            line.setAttribute('x2', '20')
            line.setAttribute('y2', '100%')
            line.setAttribute('stroke', '#ccc')
            line.setAttribute('stroke-width', '0.6')
            svg.appendChild(line)
        }

        /**
         * Clears all circles from the map range.
         */
        const clearCircles = () => {
            const mapRange = document.querySelector('#map-range')
            const circles = mapRange?.querySelectorAll('circle')
            if (circles) {
                circles.forEach((circle) =>
                    circle?.parentElement?.removeChild(circle)
                )
            }
        }

        /**
         * @param {SVGSVGElement} svg - The SVG element to query.
         * @param {number} i - The index of the data item.
         * @param {Array<{data: {value: any}}>} data - The array of data items.
         * @param {boolean} [meta=false] - Whether to process meta data.
         * @returns {SVGCircleElement | undefined} - The found circle element or undefined if not found.
         */
        const samePercentCircle = (svg, i, data, meta = false) =>
            [...svg.querySelectorAll('circle')].find((el) => {
                let result
                let dataValue = data[i].data.value
                if (meta) {
                    dataValue = parseInt(dataValue) === 0 ? 'Não' : 'Sim'
                }
                try {
                    const val = el.dataset.value
                    // @ts-ignore
                    result = JSON.parse(val).value
                } catch (e) {
                    result = el.dataset.value
                }

                return result == dataValue
            })

        // TODO: Make an assistant function to convert data and remove ts-ignores
        /**
         * @param {any} data - The data object containing map information.
         */
        const handleMapChange = (data) => {
            const svg = mapRangeSVG.value
            if (!svg || !svg.parentNode) {
                return
            }
            drawLine(svg)
            clearCircles()
            if (!data || !data.length) {
                // Reset interface max/min values
                maxVal.value = '---'
                minVal.value = '---'
                return
            }

            const svgHeight = svg.getAttribute('height')

            /** @type { string | number } */
            let maxDataVal = String(
                Math.max(
                    ...data.map((/** @type {{ data: string }} */ item) =>
                        parseFloat(item.data)
                    )
                )
            )
            let defineMinVal = '0%'
            const type = form.value.type
            if (type === 'Doses aplicadas') {
                maxDataVal = Number(
                    Math.max(
                        ...data.map(
                            (/** @type {{ data: { value: string } }} */ item) =>
                                item.data.value.replace(/[.,]/g, '')
                        )
                    )
                ).toLocaleString('pt-BR')
                defineMinVal = '0'
            } else if (type === 'Cobertura') {
                maxDataVal = '120%'
            } else if (type === 'Meta atingida') {
                maxDataVal = 'Sim'
                defineMinVal = 'Não'
            } else {
                maxDataVal = '100%'
            }

            // Setting interface values
            maxVal.value = maxDataVal
            minVal.value = defineMinVal

            // If maxVal bigger than parent element add styles

            /**
             * @type SVGSVGElement | null
             */
            const maxValEl = svg.parentNode.querySelector('.max-val')
            if (maxValEl) {
                if (maxDataVal.toString().length > 4) {
                    maxValEl.style.border = '1px solid #f0f0f0'
                    maxValEl.style.boxShadow =
                        'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px'
                } else {
                    maxValEl.style.border = '0px'
                    maxValEl.style.boxShadow = 'none'
                }
            }

            for (let i = 0; i < data.length; i++) {
                let dataVal = data[i].data.value.replace(/[.,]/g, '')
                if (data[i].data.value && data[i].data.value.includes('%')) {
                    dataVal = parseFloat(data[i].data.value)
                }

                let y = 0
                let dataValue = JSON.stringify(data[i].data)
                let samePercentCircleResult
                if (type === 'Meta atingida') {
                    y = Number(svgHeight) - (dataVal / 1) * Number(svgHeight)
                    dataValue =
                        parseInt(data[i].data.value) === 0 ? 'Não' : 'Sim'
                    samePercentCircleResult = samePercentCircle(
                        svg,
                        i,
                        data,
                        true
                    )
                } else {
                    y =
                        Number(svgHeight) -
                        (dataVal / parseInt(maxDataVal.replace(/[.,]/g, ''))) *
                            Number(svgHeight)
                    samePercentCircleResult = samePercentCircle(
                        svg,
                        i,
                        data,
                        false
                    )
                }

                if (
                    samePercentCircleResult &&
                    samePercentCircleResult.dataset &&
                    samePercentCircleResult.dataset.title
                ) {
                    const newTitle =
                        samePercentCircleResult.dataset.title.replace(
                            /\se\s/,
                            ', '
                        ) +
                        ' e ' +
                        data[i].name
                    samePercentCircleResult.setAttribute('data-title', newTitle)
                    continue
                }

                // Block to max value as full or min height
                if (y > Number(svgHeight)) {
                    y = Number(svgHeight)
                } else if (y < 0) {
                    y = 0
                }
                const circle = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'circle'
                )
                circle.setAttribute('cx', '20')
                circle.setAttribute('cy', String(y))
                circle.setAttribute('r', '6')
                circle.setAttribute('fill', data[i].color)
                if (data[i].label) {
                    circle.setAttribute('data-id', data[i].label)
                }
                circle.setAttribute('data-title', data[i].name)
                circle.setAttribute('data-value', dataValue)
                circle.setAttribute('opacity', '0.8')
                circle.setAttribute('stroke', '#aaa')
                circle.setAttribute('stroke-width', '0.4')
                svg.appendChild(circle)
            }

            svg.addEventListener(
                'mousemove',
                (e) => {
                    const target = /** @type {SVGCircleElement} */ (e.target)
                    if (target && target.tagName === 'circle') {
                        let value
                        const dataValue = target.getAttribute('data-value')
                        try {
                            value = dataValue
                                ? JSON.parse(dataValue).value
                                : dataValue
                        } catch {
                            value = dataValue
                        }
                        const parentElement = /** @type {HTMLElement} */ (
                            target.parentNode
                        )
                        parentElement.appendChild(target)
                        showTooltip(
                            e,
                            String(target.getAttribute('data-title')),
                            value
                        )
                        return
                    }
                    hideTooltip()
                },
                false
            )

            svg.addEventListener('mouseleave', () => {
                hideTooltip()
            })
        }

        /**
         * Exibe o tooltip na posição do mouse.
         * @param {MouseEvent} evt - O evento de mouse (para capturar clientX e clientY).
         * @param {string} text - O título ou texto principal.
         * @param {string|number} value - O valor a ser exibido.
         * @returns {void}
         */
        const showTooltip = (evt, text, value) => {
            const tooltip =
                /** @type {HTMLElement} - Cast necessário para garantir acesso a .style */ (
                    document.querySelector('.tooltip')
                )

            if (!tooltip) return

            tooltip.innerHTML = `
          <article>
            <div class="mct-tooltip__title">${text}</div>
            <div class="mct-tooltip__result">${value}</div>
          </article>`

            tooltip.style.display = 'block'
            tooltip.style.left = evt.clientX + 20 + 'px'
            tooltip.style.top = evt.clientY - 30 + 'px'
        }

        /**
         * Esconde o tooltip alterando o display para none.
         * @returns {void}
         */
        const hideTooltip = () => {
            const tooltip = /** @type {HTMLElement} */ (
                document.querySelector('.tooltip')
            )

            if (tooltip) {
                tooltip.style.display = 'none'
            }
        }

        const getWindowWidth = () => {
            // TODO: define a function to be called here
            // handleMapChange(datasetValues.value);
        }

        window.addEventListener('resize', getWindowWidth)

        // TODO: update code to work with new defined states vars instead of props
        watch(
            () => mapData.value,
            () => {
                if (mapData.value) {
                    datasetValues.value = mapData.value
                    handleMapChange(mapData.value)
                }
            }
        )

        watch(
            () => mapTooltip.value,
            () => {
                const query = mapTooltip.value.label
                    ? `[data-id="${mapTooltip.value.label}"]`
                    : `[data-title="${mapTooltip.value.name}"]`
                let allCircle = /** @type {any} **/ ([
                    ...document.querySelectorAll('circle'),
                ])
                let circle = document.querySelector(query)
                    ? document.querySelector(query)
                    : allCircle.find((/** @type {any} **/ item) => {
                          try {
                              const id = item.dataset.id.includes(
                                  mapTooltip.value.label
                              )
                              const name = item.dataset.title.includes(
                                  mapTooltip.value.name
                              )
                              return name || id
                          } catch {
                              // Do Nothing
                          }
                      })

                if (!circle) {
                    return
                }

                if (mapTooltip.value.opened) {
                    circle.setAttribute('r', '9')
                    circle.setAttribute('opacity', '1')
                    circle.setAttribute('stroke', '#7a7a7a')
                    return
                }

                circle.setAttribute('r', '6')
                circle.setAttribute('opacity', '0.8')
                circle.setAttribute('stroke', '#aaa')
            }
        )

        return {
            mapRangeSVG,
            maxVal,
            minVal,
        }
    },
    template: `
    <n-card
      id="map-range"
      style="max-width: 40px"
      content-style="padding: 0px; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 12px;"
    >
      <span
        class="max-val"
        style="margin: 12px 0px 0px; background-color: white; padding: 2px 8px; white-space: nowrap; border-radius: .23rem;"
      >{{ maxVal }}</span>
      <svg ref="mapRangeSVG" width="40" style="overflow: visible"></svg>
      <span style="padding: 0px 0px 12px">{{ minVal }}</span>
    </n-card>
    <div class="tooltip mct-tooltip"></div>
  `,
})
