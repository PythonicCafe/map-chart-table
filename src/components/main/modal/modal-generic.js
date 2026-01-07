import Modal from '@/components/main/modal'
import { NEmpty, NScrollbar, NSkeleton } from 'naive-ui'
import { useSlots, computed, defineComponent } from 'vue'

export default defineComponent({
    components: {
        Modal,
        NScrollbar,
        NSkeleton,
        NEmpty,
    },
    props: {
        show: { type: Boolean },
        loading: { type: Boolean },
        title: { type: String },
        modalContent: { type: String },
    },
    setup(props, { emit }) {
        const slots = useSlots()

        const showModal = computed({
            get() {
                return props.show
            },
            set(value) {
                emit('update:show', value)
            },
        })

        const hasContent = computed(() => {
            const defaultSlot = slots.default ? slots.default() : []
            return defaultSlot.length > 0
        })

        return { showModal, hasContent }
    },
    template: `
        <modal
          v-model:show="showModal"
          :title="title"
        >
          <template v-if="loading">
            <n-skeleton
              :height="48"
              :sharp="false"
              size="medium"
              style="margin-bottom: 24px; margin-top: 12px;"
            />
            <n-skeleton text :repeat="6" style="margin-bottom: 8px;" />
            <n-skeleton text style="width: 40%; margin-bottom: 24px;" />
            <n-skeleton text :repeat="6" style="margin-bottom: 8px;" />
            <n-skeleton text style="width: 60%; margin-bottom: 24px;" />
            <n-skeleton text :repeat="8" style="margin-bottom: 8px;" />
            <n-skeleton text style=" width: 60%; margin-bottom: 24px;" />
          </template>
          <template v-else-if="modalContent">
            <div v-html="modalContent"></div>
          </template>
          <template v-else-if="hasContent">
            <slot></slot>
          </template>
          <template v-else>
            <n-empty
              description="Nada para ser exibido."
              style="min-height: 70vh; display: flex; justify-content: center;"
            >
              <template #extra>
                <span
                 style="color: #c5c5c5; font-size: .95rem; font-weight: 500"
                >Página não existe ou não tem conteúdo para ser exibido.</span>
              </template>
            </n-empty>
          </template>
        </modal>
      `,
})
