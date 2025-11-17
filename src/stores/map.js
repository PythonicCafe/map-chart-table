import { defineStore } from 'pinia'
import { useContentStore } from '@/stores/content'
import { storeToRefs } from 'pinia'

import { convertArrayToObject } from '@/utils'

import { MapChart } from '@/map-chart'

/**
 * @typedef {Object} ApiResponseMap
 * @property {string[]} localNames - Array of local names.
 * @property {{ data: any }} result - Result object containing data.
 * @property {boolean} aborted - Indicates if the request was aborted.
 * @property {any[]} data - Array of data entries.
 */

/**
 * Retuns default state
 * @returns {{
 *  mapElement: null | HTMLElement
 *  map: any
 *  datasetCities: any
 *  datasetStates: any
 *  loadingMap: boolean
 *  mapChart: any
 *  currentLocal: any
 *  mapData: MapChart | null
 *  mapTooltip: any
 * }}
 */
const getDefaultState = () => {
    return {
        mapElement: null,
        map: null,
        datasetCities: null,
        datasetStates: null,
        loadingMap: false,
        mapChart: null,
        currentLocal: null,
        mapData: null,
        mapTooltip: null,
    }
}

export const useMapStore = defineStore('map', {
    state: () => getDefaultState(),
    actions: {
        updatePeriod() {
            const contentStore = useContentStore()
            const { form } = storeToRefs(contentStore)
            const startYear = form.value.periodStart
            const endYear = form.value.periodEnd
            // If updated select start or end year update period
            if (startYear && endYear) {
                const cities = this.datasetCities
                const states = this.datasetStates
                if (cities) {
                    form.value.period = Number(Object.keys(cities)[0])
                } else if (states) {
                    form.value.period = Number(Object.keys(states)[0])
                }
            }
        },
        /**
         * @param {string} period
         */
        updatePeriodManual(period) {
            if (this.datasetStates) {
                this.renderMap({
                    element: this.mapElement,
                    map: this.map,
                    loading: this.loadingMap,
                    datasetStates: this.datasetStates[period],
                })
            } else if (this.datasetCities) {
                this.renderMap({
                    element: this.mapElement,
                    map: this.map,
                    loading: this.loadingMap,
                    datasetCities: this.datasetCities[period],
                })
            }
        },
        /**
         * Renders or updates a map chart based on the provided arguments.
         *
         * @param {any} args - The arguments for rendering the map chart.
         */
        renderMap(args) {
            const contentStore = useContentStore()
            const { form, selectsPopulated } = storeToRefs(contentStore)
            const type = form.value.type

            if (!this.mapChart) {
                this.mapChart = new MapChart({
                    ...args,
                    type,
                    formPopulated: selectsPopulated.value,
                    /**
                     * @param {boolean} opened
                     * @param {string} name
                     * @param {string|number} id
                     */
                    tooltipAction: (opened, name, id) => {
                        this.mapTooltip = { opened, name, id, type }
                    },
                })
            } else {
                /** @type {MapChart} */ this.mapChart.update({
                    ...args,
                    type,
                    formPopulated: selectsPopulated.value,
                })
            }

            if (this.mapChart) {
                this.mapData = /** @type {MapChart} */ (
                    this.mapChart.datasetValues
                )
            }
        },
        async setMapData() {
            const contentStore = useContentStore()
            const { form } = storeToRefs(contentStore)

            const granularity = form.value.granularity
            let local = form.value.local
            if (granularity === 'Nacional') {
                local = ['BR']
            }
            if (!local) {
                return
            }
            const period = form.value.period

            this.datasetCities = null
            this.datasetStates = null

            this.loadingMap = true
            const results = /** @type{ApiResponseMap} */ (
                await contentStore.requestData()
            )
            this.loadingMap = false

            if (results && results.aborted) {
                this.loadingMap = false
                return
            }

            try {
                let mapSetup =
                    /** @type{{ element: any, map: any, datasetCities: any, datasetStates: any, cities: null | string[], states: null | string[], statesSelected: any, loading: boolean  }} */ ({
                        element: this.mapElement,
                        map: this.map,
                        datasetStates: null,
                        datasetCities: null,
                        cities: null,
                        loading: this.loadingMap,
                    })

                if (local.length === 1) {
                    this.datasetCities = convertArrayToObject(
                        results.result.data
                    ).data
                    this.datasetStates = null
                    this.updatePeriod()
                    mapSetup = {
                        ...mapSetup,
                        datasetCities: this.datasetCities
                            ? this.datasetCities[period]
                            : null,
                        cities: results.localNames,
                        loading: this.loadingMap,
                    }
                } else {
                    this.datasetCities = null
                    this.datasetStates = convertArrayToObject(
                        results.result.data
                    ).data
                    this.updatePeriod()
                    mapSetup = {
                        ...mapSetup,
                        datasetStates: this.datasetStates
                            ? this.datasetStates[period]
                            : null,
                        states: results.localNames,
                        statesSelected: local,
                        loading: this.loadingMap,
                    }
                }
                this.renderMap(mapSetup)
            } catch (e) {
                this.renderMap({
                    element: this.mapElement,
                    map: this.map,
                    loading: this.loadingMap,
                })
            }
        },
        async updateMap() {
            const contentStore = useContentStore()
            const { form } = storeToRefs(contentStore)

            const granularity = form.value.granularity
            const local = form.value.local

            this.loadingMap = true
            if (local.length === 1) {
                if (local + granularity !== this.currentLocal) {
                    this.map = await this.queryMap(local)
                }
                if (this.map.aborted) {
                    this.loadingMap = false
                    return
                }
                this.currentLocal = local + granularity
            } else if (local + granularity !== this.currentLocal) {
                this.map = await this.queryMap('BR')
                if (this.map.aborted) {
                    this.loadingMap = false
                    return
                }

                this.renderMap({
                    element: this.mapElement,
                    map: this.map,
                    loading: this.loadingMap,
                })
                this.currentLocal = 'BR' + granularity
            }
        },
        /**
         * @param {string[] | string} local - local to query map.
         */
        async queryMap(local) {
            const contentStore = useContentStore()
            const { form } = storeToRefs(contentStore)

            let maplocal

            if (
                form.value.granularity === 'Macrorregião de saúde' &&
                local.length > 1
            ) {
                maplocal = 'macreg/BR'
            } else if (form.value.granularity === 'Macrorregião de saúde') {
                maplocal = `macreg/${local}`
            } else if (
                form.value.granularity === 'Região de saúde' &&
                local.length > 1
            ) {
                maplocal = `reg/BR`
            } else if (form.value.granularity === 'Região de saúde') {
                maplocal = `reg/${local}`
            } else if (form.value.granularity === 'Estados') {
                maplocal = 'BR-UF'
            } else if (form.value.granularity === 'Nacional') {
                maplocal = 'BR'
            } else {
                maplocal = local
            }

            const file = await contentStore.requestMap({ map: maplocal })

            return file
        },
    },
})
