import ModalGeneric from '@/components/main/modal/modal-generic'
import ModalGenericWithTabs from '@/components/main/modal/modal-genetic-with-tabs'
import { computed, defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useModalStore } from '@/stores'

export default defineComponent({
    components: { ModalGeneric, ModalGenericWithTabs },
    props: {},
    setup() {
        const contentStore = useModalStore()
        const {
            genericModal,
            genericModalLoading,
            genericModalShow,
            genericModalTitle,
        } = storeToRefs(contentStore)

        const loading = computed(() => genericModalLoading.value)
        const title = computed(() => genericModalTitle.value)
        const modalContent = computed(() => {
            const text = genericModal.value
            if (!text || !text.length) {
                return
            }
            const div = document.createElement('div')
            div.innerHTML = text[0].content.rendered

            if (div.querySelector('table')) {
                const trs = div.querySelectorAll('table>tbody>tr')
                const result = Array.from(trs).map((tr) => ({
                    header: tr.querySelectorAll('td')[0].innerHTML,
                    content: tr.querySelectorAll('td')[1].innerHTML,
                }))
                return result
            }

            return text[0].content.rendered
        })

        return { loading, modalContent, genericModalShow, title }
    },
    template: `
      <ModalGenericWithTabs :loading :modalContent="modalContent" :title v-if="Array.isArray(modalContent)" v-model:show="genericModalShow" />
      <ModalGeneric :loading :modalContent :title v-else v-model:show="genericModalShow" />
    `,
})
