import { defineStore } from 'pinia'
import { useContentStore } from '@/stores/content'

/**
 * @typedef {Object} ApiResponseChart
 * @property {string[]} localNames - Array of local names.
 * @property {{ data: any }} result - Result object containing data.
 * @property {boolean} aborted - Indicates if the request was aborted.
 * @property {string[]} data - Array of data entries.
 */

/**
 * Retuns default state
 * @returns {{
 * dataChart: { label: string, data: (string | null)[], backgroundColor: string, borderColor: string, borderWidth: number, }[] | null
 * loading: boolean
 * locals: string[] | null
 * years: string[] | null
 * }}
 */
const getDefaultState = () => {
    return {
        dataChart: null,
        loading: false,
        locals: null,
        years: null,
    }
}

export const useChartStore = defineStore('chart', {
    state: () => getDefaultState(),
    actions: {
        async setChartData() {
            this.loading = true
            const contentStore = useContentStore()

            const response = /** @type{ApiResponseChart} */ (
                await contentStore.requestData({
                    detail: true,
                    stateNameAsCode: false,
                    stateTotal: true
                })
            )

            if (!response || response.aborted || !response?.result?.data) {
                this.resetState()
                return {}
            }

            const dataArray = response.result.data
            const data =
                /** @type{Record<string, Record<string, Record<string, string>>>} */ ({})
            const years = []
            const locals = []

            // Loop through the dataArray starting from the second element to not get header
            let localNames = /** @type string[] */ ([])
            let counter = 0

            for (let i = 1; i < dataArray.length; i++) {
                let [year, local, value, population, doses, sickImmunizer, doseDesc] =
                    dataArray[i]

                if (!isNaN(local)) {
                    local = response.localNames.find(
                        (/** @type{string} */ name) => name[0] == local
                    )
                }

                let uniqueKey = sickImmunizer
                if (doseDesc) {
                    uniqueKey = `${sickImmunizer} - ${doseDesc}`
                }

                if (!localNames.includes(local + uniqueKey)) {
                    counter++
                    localNames.push(local + uniqueKey)
                }

                // Usa uniqueKey ao invés de apenas sickImmunizer
                if (!data[uniqueKey]) {
                    data[uniqueKey] = {}
                }
                if (!data[uniqueKey][year]) {
                    data[uniqueKey][year] = {}
                }
                if (value.at(-1) === '%') {
                    data[uniqueKey][year][local] = value.substring(
                        0,
                        value.length - 1
                    )
                } else {
                    data[uniqueKey][year][local] = value
                }
                years.push(year)
                locals.push(local)
            }

            // Extract unique years and locals
            this.years = Array.from(new Set(years)).sort()
            // TODO: If not necessary as state remove from state
            this.locals = Array.from(new Set(locals))

            // Formating data to chartResult
            const chartResult =
                /** @type{Record<string, (string|null)[]>} */ ({})

            for (let local of this.locals) {
                for (let [key, val] of Object.entries(data)) {

                    let legend = ''
                    if (key.includes(' - ')) {
                        const parts = key.split(' - ')
                        const dosePart = parts.pop()
                        const namePart = parts.join(' - ')

                        legend = `${namePart} ${local} - ${dosePart}`
                    } else {
                        // Caso padrão sem dose
                        legend = `${key} ${local}`
                    }

                    for (let year of this.years) {
                        if (!chartResult[legend]) {
                            chartResult[legend] = []
                        }
                        if (val[year] && val[year][local] !== null) {
                            chartResult[legend].push(val[year][local])
                        } else {
                            chartResult[legend].push(null)
                        }
                    }
                }
            }

            /**
             * Generates a random integer between min and max (inclusive).
             *
             * @param {number} min - The minimum value of the range.
             * @param {number} max - The maximum value of the range.
             * @returns {number} A random integer within the specified range.
             */
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min
            }

            const getRandomColor = () => {
                // Generate random RGB values, ensuring they are not all 255 (to avoid white)
                let r, g, b
                do {
                    r = getRandomInt(0, 255)
                    g = getRandomInt(0, 255)
                    b = getRandomInt(0, 255)
                } while (r === 255 && g === 255 && b === 255)

                // Return the color in RGB format
                return `rgb(${r}, ${g}, ${b})`
            }

            const generateUniqueColors =
                /** @type{(numColors: number) => string[]} */ (numColors) => {
                    const colors = new Set()

                    while (colors.size < numColors) {
                        const color = getRandomColor()
                        colors.add(color)
                    }

                    return Array.from(colors)
                }

            const chartResultEntries = Object.entries(chartResult)

            const colorsBase = [
                '#e96f5f', // Base color
                '#5f9fe9', // Blue
                '#558e5a', // Darker Green
                '#e9c35f', // Yellow
                '#915fe9', // Purple
                '#3ca0a0', // Cyan
                '#ff007f', // Shocking Pink
                '#666666', // Gray
                '#e9a35f', // Orange
            ]

            const colors =
                chartResultEntries.length > 9
                    ? [
                          ...colorsBase,
                          ...generateUniqueColors(
                              chartResultEntries.length - 9
                          ),
                      ]
                    : colorsBase

            const dataChart = []
            let i = 0

            for (let [key, value] of chartResultEntries) {
                if (i > 30) {
                    // TODO: Update to call storeMessage
                    // store.commit('message/INFO', "Essa filtragem excedeu o máximo de 30 linhas, apenas 30 linhas serão exibidas")
                    break
                }
                const color = colors[i % colors.length]
                dataChart.push({
                    label: key,
                    data: value,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 2,
                })
                i++
            }

            this.dataChart = dataChart
            this.loading = false
        },
        resetState() {
            this.$reset()
        },
    },
})
