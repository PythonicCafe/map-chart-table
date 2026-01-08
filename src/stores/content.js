import { defineStore } from 'pinia'
import { DataFetcher } from '@/data-fetcher'
import { useMessageStore } from '@/stores'
import { formatToApi } from '@/common'
import { getRouter } from '@/router'
import {
    disableOptionsByTypeOrDose,
    disableOptionsByGranularityOrType,
    disableOptionsByTab,
    disableOptionsByDoseOrSick,
} from '@/utils'

/** @type {AbortController} */
let currentController

/** @type {AbortController} */
let currentControllerMap

/**
 * @typedef {object} ContentStateForm
 * @property {any | null} sickImmunizer - The selected item or its ID.
 * @property {any[]} sicks - A list of options.
 * @property {any[]} immunizers - A list of options.
 * @property {any | null} type - The selected type.
 * @property {any[]} types - A list of options.
 * @property {string[] | string} local - Selected locations (multi-select).
 * @property {any[]} locals - A list of options.
 * @property {any | null} dose - The selected dose.
 * @property {any[]} doses - A list of options.
 * @property {any | null} period - The selected period.
 * @property {any | null} years - Selected years.
 * @property {string | null} periodStart - Start date of the period.
 * @property {string | null} periodEnd - End date of the period.
 * @property {any | null} granularity - Selected granularity.
 * @property {any[]} granularities - A list of options.
 * @property {any | null} city - The selected city.
 * @property {any[]} cities - A list of options.
 */

/**
 * @typedef {object} ContentState
 * @property {string} apiUrl - URL base da API
 * @property {string} tab - Aba ativa (ex: 'map', 'chart')
 * @property {string} tabBy - Agrupamento da aba (ex: 'sicks', 'immunizers')
 * @property {string} legend - Texto da legenda
 * @property {ContentStateForm} form - Objeto com todos os filtros do formulário
 * @property {boolean} yearSlideAnimation - Controla a animação do slider de ano
 * @property {any | null} autoFilters - Configurações de filtros automáticos
 * @property {any | null} aboutVaccines - Informações "sobre vacinas"
 * @property {any | null} mandatoryVaccineYears - Anos de vacina obrigatória
 * @property {{ [key: string]: string } | null} lastUpdateDate - Data da última atualização
 * @property {{ [key: string]: { [key: string]: string } } |  null} titles - Textos de título para seções
 * @property {string | null} csvAllDataLink - Link para download de CSV completo
 * @property {any | null} doseBlocks - Configuração de blocos de dose
 * @property {any | null} granularityBlocks - Configuração de blocos de granularidade
 * @property {boolean} disableMap - Desabilita o mapa
 * @property {boolean} disableChart - Desabilita os gráficos
 * @property {boolean} loading - Estado de loading principal
 * @property {number} maxCsvExportRows - Limite de linhas para exportação CSV
 * @property {boolean} csvRowsExceeded - Indica se o limite de CSV foi excedido
 * @property {any[]} acronyms - Lista de acrônimos
 * @property {{ title: string, slug: string } | null} extraFilterButton - Botão extra de interação com modal
 */

/**
 * Return initial default store state
 * @returns {ContentState} The object state initial
 */
const getDefaultState = () => {
    return {
        apiUrl: '',
        tab: '',
        tabBy: '',
        legend: 'Fonte: Programa Nacional de Imunização (PNI), disponibilizadas no TabNet-DATASUS',
        form: {
            sickImmunizer: null,
            sicks: [],
            immunizers: [],
            type: null,
            types: [],
            local: [],
            locals: [],
            dose: null,
            doses: [],
            period: null,
            years: null,
            periodStart: null,
            periodEnd: null,
            granularity: null,
            granularities: [],
            city: null,
            cities: [],
        },
        yearSlideAnimation: false,
        autoFilters: null,
        aboutVaccines: null,
        mandatoryVaccineYears: null,
        lastUpdateDate: null,
        titles: null,
        csvAllDataLink: null,
        doseBlocks: null,
        granularityBlocks: null,
        disableMap: false,
        disableChart: false,
        loading: true,
        maxCsvExportRows: 10000,
        csvRowsExceeded: false,
        acronyms: [],
        extraFilterButton: null,
    }
}

export const useContentStore = defineStore('content', {
    state: () => getDefaultState(),
    actions: {
        /**
         * Initializes the map fetcher.
         * @param { { map: string | string[] } } map - The map identifier (slug) to fetch.
         */
        async requestMap({ map }) {
            /** @type {DataFetcher} */
            const api = new DataFetcher(this.apiUrl)

            if (currentControllerMap) {
                currentControllerMap.abort()
            }

            currentControllerMap = new AbortController()

            const signal = currentControllerMap.signal
            const result = await api.request(`map/${map}`, signal)
            return result
        },
        /**
         * Request data, process formats and maps states to code if necessary
         * @async
         * @param {Object} [options={}] - Options for the request.
         * @param {boolean} [options.detail=false] - Whether to fetch detailed data.
         * @param {boolean} [options.stateNameAsCode=true] - Whether to convert state names to their codes (UF).
         * @param {boolean} [options.stateTotal=false] - Whether to include state totals.
         * @param {number|null} [options.page=null] - Page number for pagination.
         * @param {Object} [options.sorter] - Sorting object.
         * @param {string} options.sorter.columnKey - Column to be sorted.
         * @param {string} options.sorter.order - Direction of sorting ('ascend' or 'descend').
         * @param {boolean} [options.csv=false] - Whether the request is for CSV export.
         * @returns {Promise<{ result: Object, localNames?: any, error?: any, aborted?: boolean } | void>}
         * Returns an object containing data and metadata, or void if the form is invalid.
         */
        async requestData({
            detail = false,
            stateNameAsCode = true,
            stateTotal = false,
            page = null,
            sorter = undefined,
            csv = false,
        } = {}) {
            this.loading = true
            if (currentController) {
                currentController.abort()
            }

            const api = new DataFetcher(this.apiUrl)
            const form = this.form

            currentController = new AbortController()
            const signal = currentController.signal

            // If the form field 'sickImmunizer' is an array and empty, return without making a request
            if (
                form.sickImmunizer &&
                Array.isArray(form.sickImmunizer) &&
                !form.sickImmunizer.length
            ) {
                this.loading = false
                return
            }
            // Ensure all required form fields are populated
            if (
                !form.type ||
                !form.granularity ||
                !form.sickImmunizer ||
                !form.dose ||
                (!form.periodStart && !form.periodEnd) ||
                (!form.local.length && form.granularity !== 'Nacional')
            ) {
                this.loading = false
                return
            }

            const sI = Array.isArray(form.sickImmunizer)
                ? form.sickImmunizer.join('|')
                : form.sickImmunizer
            const loc = Array.isArray(form.local)
                ? form.local.join('|')
                : form.local
            let request =
                '?tab=' +
                this.tab +
                '&tabBy=' +
                this.tabBy +
                '&type=' +
                form.type +
                '&granularity=' +
                form.granularity +
                '&sickImmunizer=' +
                encodeURIComponent(sI) +
                '&local=' +
                loc +
                '&dose=' +
                form.dose

            request += form.periodStart
                ? '&periodStart=' + form.periodStart
                : ''
            request += form.periodEnd ? '&periodEnd=' + form.periodEnd : ''
            request += page ? '&page=' + page : ''
            request += sorter
                ? '&sCol=' + sorter.columnKey + '&sOrder=' + sorter.order
                : ''

            if (detail) {
                request += '&detail=true'
            }
            if (stateTotal) {
                request += '&stateTotal=true'
            }
            if (form.city && form.city.length && form.city.length <= 30) {
              request += '&city=' + form.city
            }

            const granularity = form.granularity

            const states = form.local

            let isStateData
            if (granularity === 'Região de saúde' && states.length > 1) {
                isStateData = 'regNames'
            } else if (granularity === 'Macrorregião de saúde') {
                isStateData = 'macregNames'
            } else if (granularity === 'Região de saúde') {
                isStateData = 'regNames'
            } else if (granularity === 'Estados') {
                isStateData = 'statesNames'
            } else if (granularity === 'Nacional') {
                isStateData = 'countryName'
            } else {
                isStateData = 'citiesNames'
            }

            let result
            let localNames

            if (this.form.city && this.form.city.length > 30) {
              const body = /** @type{Record<string, string | number | boolean>} */ ({
                city: form.city,
                tab: this.tab,
                tabBy: this.tabBy,
                type: form.type,
                granularity: form.granularity,
                sickImmunizer: encodeURIComponent(sI),
                local: loc,
                dose: form.dose
              })

              if (form.periodStart) {
                body.periodStart = form.periodStart
              }
              if (form.periodEnd) {
                body.periodEnd = form.periodEnd
              }
              if (page) {
                body.page = page
              }
              if (sorter) {
                body.sorter = sorter.columnKey + sorter.order
              }
              if (detail) {
                body.detail = true
              }
              if (stateTotal) {
                body.stateTotal = true
              }

              [result, localNames] = await Promise.all([
                    api.requestDataInBody((csv ? `export-csv/` : `data/`) + request, {
                      signal,
                      body
                  }),
                  api.request(isStateData),
              ])
            } else {
              [result, localNames] = await Promise.all([
                  api.request((csv ? `export-csv/` : `data/`) + request, signal),
                  api.request(isStateData),
              ])
            }

            if (result?.aborted) {
                this.loading = false
                return { result, localNames: [] }
            }

            const messageStore = useMessageStore()
            if (!result || result.error || (result?.data?.status === 404)) {
                messageStore.message(
                    'error',
                    'Não foi possível carregar os dados. Tente novamente mais tarde.'
                )
                this.loading = false
                return { result: {}, localNames: [], error: result?.error }
            } else if (!result || (result.data && result.data.length <= 1)) {
                this.titles = null
                messageStore.message(
                    'warning',
                    'Não há dados disponíveis para os parâmetros selecionados.'
                )
                this.loading = false
                return { result: {}, localNames: [] }
            } else if (result.metadata) {
                this.titles = result.metadata.titles
                this.csvRowsExceeded = result.metadata.csv_rows_exceeded
                this.maxCsvExportRows = result.metadata.max_csv_export_rows
            }

            if (form.type !== 'Doses aplicadas') {
                /**
                 * Processes the data rows (ignoring the header):
                 * Converts the value of the third column (index 2) to a string percentage with two decimal places.
                 * Ex: 0.5 -> "0.50%"
                 */
                result.data.slice(1).forEach(
                    /** * @param {string[]} val - Array representando a linha da tabela */
                    (val) => (val[2] = Number(val[2]).toFixed(2) + '%')
                )
            } else if (form.type === 'Doses aplicadas') {
                result.data.forEach(
                    /**
                     * @param {string[]} val - Array representing lines of table
                     * @param {number} index - Current iteration number
                     */
                    (val, index) => {
                        let number = Number(val[2])
                        val[2] =
                            index > 0 ? number.toLocaleString('pt-BR') : val[2]
                    }
                )
            }

            // Update data to display state names as code
            if (result && isStateData === 'statesNames' && stateNameAsCode) {
                const newResult = []
                const data = result.data
                for (let i = 1; i < data.length; i++) {
                    const currentData = data[i]
                    const code = localNames.find(
                        /** * @param {number[]} val - Array representando a linha da tabela */
                        (val) => val[1] === currentData[1]
                    )[0]
                    currentData[1] = code
                    newResult.push(currentData)
                }
                // Add header
                newResult.unshift(data[0])
                result.data = newResult
            }

            this.loading = false
            return { result, localNames }
        },
        /**
         * Initializes the data fetcher.
         * @param {string} endpoint - The path (slug) to fetch.
         */
        async requestPage(endpoint) {
            const api = new DataFetcher(this.apiUrl)
            const result = await api.requestSettingApiEndPoint(
                endpoint,
                '/wp-json/wp/v2/pages?'
            )
            if (endpoint === 'slug=sobre-vacinas-vacinabr') {
                this.aboutVaccines = result
            }
        },
        /**
         * Initializes the data fetcher.
         * @param {string} endpoint - The path (slug) to fetch.
         */
        async requestJson(endpoint) {
            const messageStore = useMessageStore()
            const api = new DataFetcher(this.apiUrl)
            try {
                const result = await api.request(endpoint)

                if (endpoint === 'dose-blocks') {
                    this.doseBlocks = result
                } else if (endpoint === 'granularity-blocks') {
                    this.granularityBlocks = result
                } else if (endpoint === 'link-csv') {
                    this.csvAllDataLink = result.url
                } else if (endpoint === 'mandatory-vaccinations-years') {
                    this.mandatoryVaccineYears = result
                } else if (endpoint === 'lastupdatedate') {
                    this.lastUpdateDate = result
                } else if (endpoint === 'auto-filters') {
                    this.autoFilters = result
                } else if (endpoint === 'acronyms') {
                    /** @type {Object[]} Final array of formatted objects */
                    const finalResult = []

                    /** @type {string[]} The first row contains the headers */
                    const acronymsHeader = result[0]

                    result.forEach(
                        /**
                         * Iterates through matrix rows (skipping header).
                         * @param {any[]} row - Array representing the table row
                         * @param {number} i - Current row index
                         */
                        (row, i) => {
                            // Skip header row (index 0)
                            if (i < 1) {
                                return
                            }

                            /** @type {Object.<string, any>} Object being built */
                            const resultRow = {}

                            row.forEach(
                                /**
                                 * Maps column value to the corresponding header key.
                                 * @param {any} col - Cell value
                                 * @param {number} j - Column index
                                 */
                                (col, j) => {
                                    resultRow[acronymsHeader[j]] = col
                                }
                            )

                            finalResult.push(resultRow)
                        }
                    )
                    this.acronyms = finalResult
                }
            } catch (e) {
                messageStore.message(
                    'error',
                    `Não foi possível carregar os dados de '/${endpoint}'`
                )
            }
        },
        /**
         * Initializes the data fetcher.
         * @param { { map: string } } object - The map identifier (slug) to fetch.
         */
        async initial({ map }) {
            this.requestMap({ map })
        },
        /**
         * Remove query from router.
         * @param { string } key - A query to be removed from router.
         */
        removeQueryFromRouter(key) {
            const router = getRouter()
            const messageStore = useMessageStore()

            const searchString = window.location.search
            const params = new URLSearchParams(searchString)
            const routeArgs = Object.fromEntries(params)

            const URLquery = routeArgs
            delete URLquery[key]

            messageStore.message(
                'warning',
                'URL contém valor inválido para filtragem'
            )

            router?.replace({ query: URLquery })
        },
        /**
         * Define app form state from URL.
         */
        setStateFromUrl() {
            const searchString = window.location.search
            const params = new URLSearchParams(searchString)
            const routeArgs = Object.fromEntries(params)

            const formState = this.form

            /** @type {ContentStateForm} */
            const routerResult = {}
            /** @type {{ [key: string]: string[] | string | number }} */
            const routerResultTabs = {}

            if (!Object.keys(routeArgs).length) {
                this.setTabField('map')
                this.setTabByField('sicks')
                return
            }

            const routeArgsAsEntries = Object.entries(routeArgs)

            const isTabDefinedInRouterArgs = !routeArgsAsEntries.find(
                (item) => item[0] === 'tab'
            )

            const includeTabs = ['chart', 'table']
            const isTabToShowSickAsArray =
                !isTabDefinedInRouterArgs || includeTabs.includes(this.tab)

            for (const [key, val] of routeArgsAsEntries) {
                if (!val) {
                    continue
                }
                const value = String(val)
                if (key === 'sickImmunizer') {
                    if (isTabToShowSickAsArray) {
                        const values = value.split(',')
                        const sicks = formState['sicks'].map((el) => el.value)
                        const immunizers = formState['immunizers'].map(
                            (el) => el.value
                        )
                        if (
                            values.every((val) => sicks.includes(val)) ||
                            values.every((val) => immunizers.includes(val))
                        ) {
                            routerResult[key] = values
                        } else {
                            this.removeQueryFromRouter(key)
                        }
                    } else if (
                        formState['sicks'].some((el) => el.value === value) ||
                        formState['immunizers'].some((el) => el.value === value)
                    ) {
                        routerResult[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'city') {
                    const values = value.split(",")
                    const cities = formState["cities"].map(el => el.codigo6)

                    if (values.every(val => cities.includes(val))) {
                        routerResult[key] = values
                    } else {
                      this.removeQueryFromRouter(key)
                    }
                } else if (key === 'local') {
                    const values = value.split(',')
                    const locals = formState['locals'].map((el) => el.value)
                    if (values.every((val) => locals.includes(val))) {
                        routerResult.local = values
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'granularity') {
                    if (
                        formState['granularities'].some(
                            (el) => el.value === value
                        )
                    ) {
                        routerResult[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'dose') {
                    if (formState['doses'].some((el) => el.value === value)) {
                        routerResult[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'type') {
                    if (formState['types'].some((el) => el.value === value)) {
                        routerResult[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'tab') {
                    if (['map', 'chart', 'table'].some((el) => el === value)) {
                        routerResultTabs[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'tabBy') {
                    if (['immunizers', 'sicks'].some((el) => el === value)) {
                        routerResultTabs[key] = value
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'periodStart' || key === 'periodEnd') {
                    const resultValue = Number(value)
                    if (
                        formState['years'].some(
                            /** @param {{ value: number }} el - Objeto com campo value representando ano */
                            (el) => el.value === resultValue
                        )
                    ) {
                        routerResult[key] = String(resultValue)
                    } else {
                        this.removeQueryFromRouter(key)
                    }
                } else if (key === 'period') {
                    routerResult[key] = Number(value)
                } else if (value.includes(',')) {
                    //@ts-ignore
                    routerResult[key] = value.split(',')
                } else {
                    //@ts-ignore
                    routerResult[key] = value ?? null
                }
            }

            this.setTabField(
                routerResultTabs?.tab ? String(routerResultTabs.tab) : 'map'
            )
            this.setTabByField(
                routerResultTabs?.tabBy
                    ? String(routerResultTabs.tabBy)
                    : 'sicks'
            )

            for (let [key, value] of Object.entries(routerResult)) {
                this.setFormField(key, value)
            }
        },
        setUrlFromState() {
            const router = getRouter()
            const searchString = window.location.search
            const params = new URLSearchParams(searchString)
            const routeArgs = Object.fromEntries(params)

            let stateResult = formatToApi({
                form: { ...this.form },
                tab: this.tab !== 'map' ? this.tab : undefined,
                tabBy: this.tabBy !== 'sicks' ? this.tabBy : undefined,
            })

            if (
                Array.isArray(stateResult.sickImmunizer) &&
                stateResult.sickImmunizer.length
            ) {
                stateResult.sickImmunizer = [
                    ...stateResult?.sickImmunizer,
                ].join(',')
            }
            if (Array.isArray(stateResult.local) && stateResult.local.length) {
                stateResult.local = [...stateResult?.local].join(',')
            }

            if (Array.isArray(stateResult.city)) {
              const cityLength = stateResult.city.length
              if (cityLength && cityLength <= 30) {
                stateResult.city = [...stateResult?.city].join(",")
              } else {
                stateResult.city = []
              }
            }

            if (JSON.stringify(routeArgs) === JSON.stringify(stateResult)) {
                return
            }

            router?.replace({ query: stateResult })
        },
        async updateFormSelect() {
            const api = new DataFetcher(this.apiUrl)
            /** @type {any} payload */
            const payload = {}
            const options = await api.request('options')
            if (!options) {
                return
            }
            // TODO: make an error handling in case of api offline or instead of value we have an error
            for (let [key, value] of Object.entries(options)) {
                if (key === 'cities') {
                    payload[key] = value.map(
                        (
                            /** @type {{ uf: String, nome: String, codigo6: string }} */ item
                        ) => {
                            return {
                                ...item,
                                label: `${item.uf} - ${item.nome}`,
                                value: item.codigo6,
                            }
                        }
                    )
                } else {
                    value.sort()
                    payload[key] = value.map((/** @type {String} */ item) => {
                        return { label: item, value: item }
                    })
                }
            }
            for (let [key, value] of Object.entries(payload)) {
                //@ts-ignore
                this.setFormField(key, value)
            }
        },
        clear() {
            this.disableMap = false
            this.disableChart = false
            const defaultState = getDefaultState()
            Object.keys(defaultState.form).forEach((key) => {
                // Reset only default select fields, in this case options are not comming from API
                if (!key.endsWith('s')) {
                    //@ts-ignore
                    this.setFormField(key, defaultState.form[key])
                }
            })
            this.tab = 'map'
            this.tabBy = 'sicks'
            disableOptionsByTypeOrDose(this)
            disableOptionsByGranularityOrType(this)
            disableOptionsByDoseOrSick(this)
            disableOptionsByTab(this)
        },
        /**
         * Atualiza um campo do formulário e executa as regras de negócio associadas
         * @param {string} key - O nome do campo (ex: 'type', 'dose')
         * @param {any} value - O novo valor
         */
        setFormField(key, value) {
            if (key === 'tab') {
                this.setTabField(value)
                return
            } else if (key === 'tabBy') {
                this.setTabByField(value)
                return
            }
            if (key === 'periodStart') {
                if (!value && this.form.periodEnd) {
                    this.form.period = this.form.periodEnd
                } else {
                    this.form.period = value
                }
            } else if (key === 'periodEnd' && !this.form.periodStart) {
                // If update and not periodStart, set period as periodEnd value
                this.form.period = value
            } else if (key === 'sickImmunizer' || key === 'dose') {
                disableOptionsByDoseOrSick(this, { [key]: value })
                disableOptionsByTypeOrDose(this, key, value)
                // After sickImmunizer update dose select update with type and granularity
                const type = this.form.type
                if (type) {
                    disableOptionsByTypeOrDose(this, 'type', type)
                    disableOptionsByGranularityOrType(this, { type: type })
                }
            } else if (key === 'granularity') {
                disableOptionsByGranularityOrType(this, { [key]: value })
            } else if (key === 'type') {
                disableOptionsByTypeOrDose(this, key, value)
                disableOptionsByGranularityOrType(this, { [key]: value })
            }

            // @ts-ignore
            this.form[key] = value

            if (
                this.form.sickImmunizer &&
                this.form.type &&
                this.form.local.length &&
                this.form.periodStart &&
                this.form.periodEnd &&
                this.form.granularity &&
                // Avoid unecessary updates and enable use empty dose field
                !Object.keys({ key, value }).includes('period') &&
                !Object.keys({ key, value }).includes('dose') &&
                !this.form.dose
            ) {
                const activeDoses = this.form.doses.filter(
                    (dose) => !dose.disabled
                )
                if (activeDoses.length) {
                    const newDose = activeDoses[activeDoses.length - 1].value
                    disableOptionsByDoseOrSick(this, { dose: newDose })
                    disableOptionsByTypeOrDose(this, 'dose', newDose)
                    this.form.dose = newDose
                }
            }
            this.checkGramWithState()
        },
        checkGramWithState() {
            if (
                this.form.granularity === 'Municípios' &&
                this.form.local.length > 1
            ) {
                if (this.tab === 'map') {
                    this.setTabField('table')
                }
                this.disableMap = true
            } else if (
                this.form.granularity === 'Municípios' ||
                this.form.type === 'Meta atingida'
            ) {
                this.disableMap = false
            } else {
                this.disableMap = false
                this.disableChart = false
            }
        },
        /**
         * @param {string} value - New tab value selected
         */
        setTabField(value) {
            const messageStore = useMessageStore()
            this.tab = value

            if (['table', 'chart'].includes(value)) {
                if (!this.form.sickImmunizer) {
                    this.form.sickImmunizer = []
                } else if (!Array.isArray(this.form.sickImmunizer)) {
                    this.form.sickImmunizer = [this.form.sickImmunizer]
                    messageStore.message(
                        'info',
                        'Seletores atualizados para tipo de exibição selecionada'
                    )
                }
            } else if (
                this.form.sickImmunizer &&
                Array.isArray(this.form.sickImmunizer) &&
                this.form.sickImmunizer.length > 0
            ) {
                this.form.sickImmunizer = this.form.sickImmunizer[0]
                disableOptionsByDoseOrSick(this, {
                    ['sickImmunizer']: this.form.sickImmunizer,
                })
                messageStore.message(
                    'info',
                    'Seletores atualizados para tipo de exibição selecionada'
                )
            } else {
                this.form.sickImmunizer = null
            }

            this.checkGramWithState()
        },
        /**
         * @param {string} value - New value tab selected
         */
        setTabByField(value) {
            disableOptionsByGranularityOrType(this)
            disableOptionsByTab(this, { tabBy: value })
            this.tabBy = value

            this.form.sickImmunizer = Array.isArray(this.form.sickImmunizer)
                ? []
                : null
            this.form.dose = null
            this.form.granularity = null
            this.form.type = null

            disableOptionsByTypeOrDose(this)
            disableOptionsByDoseOrSick(this)
        },
    },
    getters: {
        disableLocalSelect: (state) => {
            const granularity = state.form.granularity

            if (granularity === 'Nacional') {
                state.form.local = []
                return true
            }
            return false
        },
        mainTitle: (state) => {
            let title = null
            const { sickImmunizer, dose, granularity, local, period, type } =
                state.form
            if (
                sickImmunizer &&
                Array.isArray(sickImmunizer) &&
                !sickImmunizer.length
            ) {
                return
            }
            if (
                !dose ||
                !granularity ||
                !period ||
                !sickImmunizer ||
                !type ||
                (!local.length && granularity !== 'Nacional')
            ) {
                return
            }
            if (state.titles) {
                if (state.tab === 'map' && state.titles.map) {
                    title = state.titles.map?.title + ' em ' + period
                } else {
                    title = state.titles.table.title
                }
            }
            return title
        },
        subTitle: (state) => {
            let subtitle = null
            const { sickImmunizer, dose, granularity, local, period, type } =
                state.form
            if (
                sickImmunizer &&
                Array.isArray(sickImmunizer) &&
                !sickImmunizer.length
            ) {
                return
            }
            if (
                !granularity ||
                !period ||
                !sickImmunizer ||
                !type ||
                (!local.length && granularity !== 'Nacional') ||
                !dose
            ) {
                return
            }

            if (state.titles) {
                subtitle =
                    state.tab === 'map'
                        ? state.titles.map?.subtitle
                        : state.titles.table.subtitle
            }
            return subtitle
        },
        selectsPopulated: (state) => {
            const { sickImmunizer, dose, granularity, local, period, type } =
                state.form

            const isSickImuAnArray =
                sickImmunizer && Array.isArray(sickImmunizer)
            const isSickImuFilledArray =
                isSickImuAnArray && sickImmunizer.length
            const isSickImuFilledField = !isSickImuAnArray && sickImmunizer
            return (
                (isSickImuFilledArray || isSickImuFilledField) &&
                dose &&
                granularity &&
                (local.length ||
                    (!local.length && granularity === 'Nacional')) &&
                period &&
                type
            )
        },
        selectsEmpty: (state) => {
            const form = state.form
            if (
                // If sickImmunizer selected in map or if sickImmunizer array is empty in chart and tables
                (form.sickImmunizer && !Array.isArray(form.sickImmunizer)) ||
                (form.sickImmunizer && form.sickImmunizer.length) ||
                form.type ||
                form.local.length ||
                form.period ||
                form.granularity
            ) {
                return false
            }
            return !state.loading
        },
    },
})
