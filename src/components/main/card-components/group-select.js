import { defineComponent, computed, h, ref, watch, onBeforeUnmount } from 'vue'
import { NTreeSelect, NTooltip, NIcon } from 'naive-ui'
import { groupOptionsByVariant } from '@/utils'

/** Delay in milliseconds before the disabled-option tooltip is shown. */
const TOOLTIP_DELAY_MS = 300

/**
 * @typedef {Object} TooltipState
 * @property {boolean} show
 * @property {number} x
 * @property {number} y
 * @property {string} text
 */

export default defineComponent({
    name: 'GroupSelect',
    components: { NTreeSelect, NTooltip },
    props: {
        options: { type: Array, required: true },
        value: { type: [String, Array, null], default: null },
        multiple: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        placeholder: { type: String, default: 'Selecione' },
        style: { type: String, default: '' },
    },
    emits: ['update:value', 'update:show', 'clear'],
    setup(props, { emit }) {
        const biCheck = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 21 21"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41L9 16.17z" fill="#e96f5f"></path></svg>`;

        const treeOptions = computed(() => {
            const grouped = groupOptionsByVariant(/** @type {any} */ (props.options))
            if (props.multiple) return grouped
            // Single-select mode has no checkboxes/cascade: the group header itself
            // must not be a pickable value, only its children (real API values) are.
            return grouped.map((node) =>
                node.children ? { ...node, disabled: true } : node
            )
        })

        const groupLabelByKey = computed(() =>
            Object.fromEntries(
                treeOptions.value.flatMap((node) =>
                    node.children
                        ? [
                              [node.key, node.label],
                              ...node.children.map((child) => [child.key, node.label]),
                          ]
                        : [[node.key, node.label]]
                )
            )
        )

        /**
         * Controlled expansion state. Replaces `default-expand-all` so that
         * group headers can toggle themselves on click.
         * @type {import('vue').Ref<Array<string | number>>}
         */
        const expandedKeys = ref([])

        // Re-expand every group whenever the options change (mimics `default-expand-all`).
        watch(
            treeOptions,
            (nodes) => {
                expandedKeys.value = nodes
                    .filter((node) => node.children?.length)
                    .map((node) => node.key)
            },
            { immediate: true }
        )

        /**
         * Single manual tooltip anchored to the hovered tree node via virtual coordinates.
         * @type {import('vue').Ref<TooltipState>}
         */
        const tooltip = ref({ show: false, x: 0, y: 0, text: '' })

        /** @type {ReturnType<typeof setTimeout> | null} */
        let showTimer = null

        const clearShowTimer = () => {
            if (showTimer === null) return
            clearTimeout(showTimer)
            showTimer = null
        }

        /**
         * Schedules the tooltip display after `TOOLTIP_DELAY_MS`.
         * The node geometry is read synchronously: `event.currentTarget`
         * is reset to null once the handler returns, so it cannot be read inside the timeout.
         *
         * @param {MouseEvent} event
         * @param {string} text
         */
        const showTooltip = (event, text) => {
            const rect = /** @type {HTMLElement} */ (event.currentTarget).getBoundingClientRect()
            const x = rect.right
            const y = rect.top + rect.height / 2

            clearShowTimer()
            showTimer = setTimeout(() => {
                tooltip.value = { show: true, x, y, text }
                showTimer = null
            }, TOOLTIP_DELAY_MS)
        }

        const hideTooltip = () => {
            clearShowTimer()
            tooltip.value = { ...tooltip.value, show: false }
        }

        onBeforeUnmount(clearShowTimer)

        /** @param {Array<string | number>} keys */
        const handleUpdateExpandedKeys = (keys) => {
            expandedKeys.value = keys
        }

        /** @param {string | number} key */
        const toggleExpanded = (key) => {
            expandedKeys.value = expandedKeys.value.includes(key)
                ? expandedKeys.value.filter((k) => k !== key)
                : [...expandedKeys.value, key]
        }

        /** @param {string} str */
        const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        /**
         * @param {string} pattern
         * @param {import('naive-ui').TreeSelectOption} node
         * @returns {boolean}
         */
        const treeFilter = (pattern, node) => {
            if (!pattern.length) return true
            const needle = removeAccents(pattern).toLowerCase()
            const label = removeAccents(String(node.label ?? '')).toLowerCase()
            const groupLabel = removeAccents(
                groupLabelByKey.value[/** @type {string} */ (node.key)] ?? ''
            ).toLowerCase()
            return label.includes(needle) || groupLabel.includes(needle)
        }

        const renderLabel =
          /** * @param {{ option: { shortLabel: string, label: string }}} option */
          ({ option }) => option.shortLabel || option.label

        /**
         * Builds the attributes for each tree node.
         * Disabled nodes carrying a `disabledText` drive the shared `NTooltip`
         * through hover handlers placed on the node element itself.
         * In single-select mode, group headers receive the BEM modifier
         * `tree-selector__node--group` and toggle their expansion on click.
         *
         * @param {{ option: { key: string | number, disabled?: boolean, disabledText?: string, children?: unknown[] } }} info
         * @returns {Record<string, unknown>}
         */
        const nodeProps = ({ option }) => {
            const isGroupHeader = !props.multiple && Boolean(option.children?.length)

            /** @type {Record<string, unknown>} */
            const attrs = {
                class: isGroupHeader
                    ? 'tree-selector__node tree-selector__node--group'
                    : 'tree-selector__node',
            }

            if (option.disabled && option.disabledText) {
                const text = option.disabledText
                attrs.onMouseenter = (/** @type {MouseEvent} */ event) => showTooltip(event, text)
                attrs.onMouseleave = hideTooltip
            }
            if (isGroupHeader) attrs.onClick = () => toggleExpanded(option.key)

            return attrs
        }

        /**
         * Conditionally renders a checkmark icon on the right side of selected tree options.
         *
         * @param {Object} info - Context object supplied by NTreeSelect
         * @param {boolean} info.selected - Flag indicating if the current item is selected
         * @param {any} info.option - Current tree option
         * @returns {import('vue').VNode|null}
         */
        const renderSuffix = ({ selected, option }) => {
          if (!selected) return null

          /* Injects the raw SVG string directly into NIcon using the innerHTML prop */
            return h(NIcon, {
              class: 'tree-select-wrapper__check-icon',
              innerHTML: biCheck
            })
        }

        return {
            treeOptions,
            expandedKeys,
            tooltip,
            treeFilter,
            renderLabel,
            nodeProps,
            handleUpdateExpandedKeys,
            handleUpdateValue:
              /** * @param {{ value: string }} value */
              (value) => emit('update:value', value),
            handleUpdateShow:
              /** * @param {boolean} show */
              (show) => {
                  if (!show) hideTooltip()
                  emit('update:show', show)
              },
            handleClear: () => emit('clear'),
            renderSuffix
        }
    },
    template: `
        <n-tree-select
            :value="value"
            :options="treeOptions"
            :multiple="multiple"
            :checkable="multiple"
            :cascade="multiple"
            :check-strategy="multiple ? 'child' : undefined"
            :disabled="disabled"
            :placeholder="placeholder"
            :style="style"
            :expanded-keys="expandedKeys"
            clearable
            filterable
            max-tag-count="responsive"
            :filter="treeFilter"
            :render-label="renderLabel"
            :node-props="nodeProps"
            @update:value="handleUpdateValue"
            @update:show="handleUpdateShow"
            @update:expanded-keys="handleUpdateExpandedKeys"
            @clear="handleClear"
            :render-suffix="renderSuffix"
            :consistent-menu-width="false"
        />
        <n-tooltip
            trigger="manual"
            placement="right"
            :show="tooltip.show"
            :x="tooltip.x"
            :y="tooltip.y"
        >
            {{ tooltip.text }}
        </n-tooltip>
    `,
})
