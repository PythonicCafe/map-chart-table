import '@/assets/css/style.css'
import Config from '@/components/config'
import Main from '@/components/main'
import router from '@/router'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { storeToRefs } from 'pinia'
import { useModalStore, useContentStore } from '@/stores'

/**
 * @file Manages the rendering of a map, chart and table component.
 * @module MapChartTable
 */

/**
 * Represents a component for rendering a map, chart, and table.
 * @class MapChartTable
 */
class MapChartTable {
    self = this

    /**
     * A function that opens a generic modal with a title and slug, handling loading states and fetching content.
     * @type {((title: string, slug: string) => Promise<void>) | undefined}
     */
    genericModal

    /**
     * A function that handles opening a generic modal with title and slug, manages loading states, and fetches content.
     * @type {((title: string, slug: string) => Promise<void>) | undefined}
     */
    genericModalWithFilterButton

    /**
     * The API endpoint URL.
     * @type {string}
     */
    api

    /**
     * The base address for resources or other URLs.
     * @type {string}
     */
    baseAddress

    /**
     * Creates an instance of MapChartTable.
     * @constructor
     * @param {object} config - Configuration object for the component.
     * @param {string} config.api - The API endpoint URL.
     * @param {string} [config.baseAddress=''] - The base address, defaults to an empty string if not provided.
     */

    /**
     * Constructs a new instance of the class.
     * @param {Object} options - The configuration options for the instance.
     * @param {string} options.api - The API address to be used by the instance.
     * @param {string} [options.baseAddress=''] - The base address for requests, defaults to an empty string.
     */
    constructor({ api = '', baseAddress = '' }) {
        this.api = api
        this.baseAddress = baseAddress
        this.render()
    }

    /**
     * Renders the component, setting up Vue and Pinia applications to include Config and Main components.
     * @returns {void}
     */
    render() {
        const self = this
        const App = {
            components: { Config, Main },
            setup() {
                const modalStore = useModalStore()
                const {
                    genericModal,
                    genericModalShow,
                    genericModalTitle,
                    genericModalLoading,
                } = storeToRefs(modalStore)

                const contentStore = useContentStore()
                const { extraFilterButton } = storeToRefs(contentStore)

                self.genericModal = async (title, slug) => {
                    genericModalLoading.value = true
                    genericModal.value = null
                    genericModalShow.value = !genericModalShow.value
                    genericModalTitle.value = title
                    try {
                        await modalStore.requestContent(slug)
                    } catch {
                        // Do Nothing
                    }
                    genericModalLoading.value = false
                }

                self.genericModalWithFilterButton = async (title, slug) => {
                    extraFilterButton.value = { title, slug }
                }

                return { api: self.api }
            },
            template: `
              <Config>
                <Main :api="api" />
              </Config>
            `,
        }

        const pinia = createPinia()
        const app = createApp(App)

        app.use(pinia)
        app.use(router(this.baseAddress))
        app.mount('#app')
    }
}

export default MapChartTable
