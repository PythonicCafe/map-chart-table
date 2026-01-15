import { defineStore } from 'pinia'
import { useContentStore } from '@/stores/content'
import { formatToTable } from '@/utils'

/**
 * @typedef {object} ApiResponseTable
 * @property {string[]} localNames
 * @property {{ data: any, metadata: { pages: { total_pages: string, total_records: string }, type: string } }} result
 * @property {any} error
 * @property {boolean} aborted
 * @property {string[]} data
 */

/**
 * Retuns default state
 * @returns {{
 *  columns: { title: string, minWidth: string | number, key: string }[]
 *  loading: boolean
 *  page: number
 *  pageCount: number
 *  pageTotalItems: number
 *  rows: string[]
 *  sorter: { columnKey: string, order: string } | undefined
 * }}
 */
const getDefaultState = () => {
    return {
        columns: [],
        loading: false,
        page: 1,
        pageCount: 0,
        pageTotalItems: 10,
        rows: [],
        sorter: undefined,
    }
}

export const useTableStore = defineStore('table', {
    state: () => getDefaultState(),
    actions: {
        async setTableData() {
            this.loading = true
            const contentStore = useContentStore()
            const response = /** @type{ApiResponseTable} */ (
                await contentStore.requestData({
                    detail: true,
                    page: this.page,
                    sorter: this.sorter,
                })
            )

            if (response?.aborted || !response || !response.result.data) {
                this.rows = []
                this.loading = false
                return
            }

            this.pageCount = Number(response.result.metadata.pages.total_pages)
            this.pageTotalItems = Number(
                response.result.metadata.pages.total_records
            )

            const tableData = formatToTable(
                response.result.data,
                response.localNames,
                response.result.metadata
            )
            this.columns =
                /** @type {{ title: string, minWidth: string | number, key: string }[]} */ (
                    tableData.header
                )
            const dosesQtd = this.columns.findIndex(
                (column) => column.title === 'Doses (qtd)'
            )
            if (response.result.metadata.type == 'Doses aplicadas') {
                this.columns.splice(dosesQtd, 1)
            } else {
                this.columns[dosesQtd].minWidth = '130px'
            }
            const columnValue = this.columns.find(
                (column) => column.key === 'valor'
            )
            if (columnValue) {
                columnValue.minWidth = '160px'
                columnValue.title = response.result.metadata.type
            }
            this.rows = /** @type {string[]} */ (tableData.rows)
            this.loading = false
        },
        resetState() {
            this.$reset()
        },
    },
})
