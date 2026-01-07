import { defineStore } from 'pinia'
import { DataFetcher } from '@/data-fetcher'
import { useContentStore } from '@/stores'

/**
 * @typedef {object} ModalState
 * @property {boolean} genericModalLoading - Estado de loading do modal genérico
 * @property {boolean} genericModalShow - Controla a exibição do modal genérico
 * @property {string | null} extraFilterButton - Configuração de botão de filtro extra
 * @property {{[key: string]: any; error?: Error | undefined; aborted?: boolean | undefined;} | null} genericModal - Conteúdo do modal genérico
 * @property {string | null} genericModalTitle - Título do modal genérico
 * @returns {ModalState} The object state initial
 */
const getDefaultState = () => {
    return {
        genericModal: null,
        genericModalTitle: null,
        genericModalLoading: false,
        extraFilterButton: null,
        genericModalShow: false,
    }
}

export const useModalStore = defineStore('modal', {
    state: () => getDefaultState(),
    actions: {
        /**
         * Request page data
         * @param {string} slug - Url path
         * @return Promise<void>
         */
        async requestContent(slug) {
            const contentStore = useContentStore()
            const api = new DataFetcher(contentStore.apiUrl)
            const result = await api.requestSettingApiEndPoint(
                slug,
                '/wp-json/wp/v2/pages'
            )
            this.genericModal = result
        },
    },
})
