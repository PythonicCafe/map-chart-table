import {
    defineComponent,
    ref,
    toRaw,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
    nextTick,
    h,
} from 'vue'

import {
    NSelect,
    NFormItem,
    NDatePicker,
    NButton,
    NIcon,
    NSpin,
    NSpace,
    NTooltip,
} from 'naive-ui'

import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores'
import { biEraser } from '@/icons'

import { useMessageStore } from '@/stores'

export default defineComponent({
    components: {
        NButton,
        NDatePicker,
        NFormItem,
        NIcon,
        NSelect,
        NSpace,
        NSpin,
        NTooltip,
    },
    props: {
        isMobileScreen: {
            default: false,
            type: Boolean,
        },
    },
    setup(props) {
        const messageStore = useMessageStore()
        /** @type {any[]} */
        const allCitiesValues = []

        const contentStore = useContentStore()
        const { form, tab, tabBy, disableLocalSelect, yearSlideAnimation } =
            storeToRefs(contentStore)

        /** @type import('vue').Ref */
        const activeSelectKey = ref({})
        /** @type import('vue').Ref */
        const citiesTemp = ref([])
        /** @type import('vue').Ref */
        const cityTemp = ref(null)
        /** @type import('vue').Ref */
        const firstLoadCities = ref(true)
        /** @type import('vue').Ref */
        const formRef = ref(null)
        /** @type import('vue').Ref */
        const isLoadingCities = ref(false)
        /** @type import('vue').Ref */
        const localTemp = ref(null)
        /** @type import('vue').Ref */
        const resizeObserver = ref(null)
        /** @type import('vue').Ref */
        const selectRefsMap = ref({})
        /** @type import('vue').Ref */
        const sickTemp = ref(null)
        /** @type import('vue').Ref */
        const showingLocalsOptions = ref(null)
        /** @type import('vue').Ref */
        const showingSicksOptions = ref(null)

        /** @type import('vue').Ref */
        const showCitiesSelect = ref(false)

        // Computed
        const disableAll = computed(() => yearSlideAnimation.value)

        const styleWidth = computed(() =>
            props.isMobileScreen ? 'width: 400px;' : 'width: 200px;'
        )

        /**
         * @param {string} key
         * @param {string} value
         * @returns void
         */
        const updateDate = (key, value) => {
            contentStore.setFormField(key, value)
            updateDatePosition()
        }

        const updateDatePosition = () => {
            const formValue = form.value
            const endDate = formValue.periodEnd
            const startDate = formValue.periodStart
            const tsEndDate = endDate
            const tsStartDate = startDate

            if (!tsStartDate || !tsEndDate) {
                return
            } else if (tsStartDate > tsEndDate) {
                contentStore.setFormField('periodEnd', startDate)
                contentStore.setFormField('periodStart', endDate)
                return
            }
        }
        /**
         * Select all states function
         * @param {string} field
         */
        const selectAllLocals = (field) => {
            const formValue = form.value
            const allOptions = toRaw(formValue.locals)
            const selectLength = Array.isArray(localTemp.value)
                ? localTemp.value.length
                : null
            if (selectLength == allOptions.length) {
                localTemp.value = []
                handleShowUpdate(true, field)
                return
            }

            localTemp.value = allOptions.map((option) => option.value)
            // handleShowUpdate(true, field)
        }
        /**
         * @param {Boolean} show
         * @param {String} key
         */
        const handleShowUpdate = (show, key) => {
            if (show) {
                activeSelectKey.value = key
            } else if (activeSelectKey.value === key) {
                activeSelectKey.value = null
            }
        }
        /**
         * Select all cities function
         * @param {String} field
         * @param {Boolean} uncheckAll
         */
        const selectAllCities = (field, uncheckAll = false) => {
            const formValue = form.value
            if (isLoadingCities.value) {
                return
            }
            isLoadingCities.value = true

            // We use setTimeout to run this code after Vue render process
            setTimeout(() => {
                const selectLength = Array.isArray(cityTemp.value)
                    ? cityTemp.value.length
                    : null

                if (Array.isArray(form.value.local) && form.value.local.length) {

                  if (
                    Array.isArray(cityTemp.value) &&
                    Array.isArray(citiesTemp.value) &&
                    cityTemp.value.length === citiesTemp.value.length
                  ) {
                    formValue.city = []
                    cityTemp.value = []
                    handleShowUpdate(true, field)
                    isLoadingCities.value = false
                    return
                  }

                  let result = /** @type{string[]} */ ([])
                  form.value.local.forEach((/** @type{string} **/ state) => {
                    form.value.cities.filter((/** @type{{ uf: string }} */ item) => item.uf === state)
                    const cities = /** @type{string[]} */ (
                      form.value.cities.filter((/** @type{{ uf: string }} */ item) => item.uf === state).map(city => city.codigo6)
                    )
                    result.push(...cities)
                  })
                  formValue.city = result
                  cityTemp.value = result
                } else {
                  const allOptions = toRaw(citiesTemp.value)

                  if (selectLength === allOptions.length || uncheckAll) {
                      formValue.city = []
                      cityTemp.value = []
                      handleShowUpdate(true, field)
                      isLoadingCities.value = false
                      return
                  }

                  formValue.city = allCitiesValues
                  cityTemp.value = allCitiesValues
                }

                handleShowUpdate(true, field)
                isLoadingCities.value = false
            }, 0)
        }
        /**
         * @param {Boolean} show
         * @param {string} field
         */
        const handleLocalsUpdateShow = (show, field) => {
            showingLocalsOptions.value = show
            if (!showingLocalsOptions.value && localTemp.value) {
                contentStore.setFormField('local', localTemp.value)
            }
            handleShowUpdate(show, field)
        }
        /**
         * @param {String} value
         */
        const handleLocalsUpdateValue = (value) => {
            localTemp.value = value
            if (!showingLocalsOptions.value && localTemp.value) {
                contentStore.setFormField('local', localTemp.value)
            }
            // Close hover box options remover - Mantido o comentário
        }
        /**
         * @param {Boolean} show
         * @param {String} field
         */
        const handleSicksUpdateShow = (show, field) => {
            showingSicksOptions.value = show

            if (
                !showingSicksOptions.value &&
                sickTemp.value &&
                tab.value !== 'map'
            ) {
                contentStore.setFormField('sickImmunizer', sickTemp.value)
            }
            handleShowUpdate(show, field)
        }
        /**
         * @param {String} value
         */
        const handleSicksUpdateValue = (value) => {
            sickTemp.value = value
            if (!showingSicksOptions.value && sickTemp.value) {
                contentStore.setFormField('sickImmunizer', value)
            }
            // Close hover box options remover - Mantido o comentário
        }

        const eraseForm = () => {
            contentStore.clear()
        }

        /**
         * @param {String} key
         */
        const clear = (key) => {
            if (key === 'sickImmunizer') {
                sickTemp.value = null
                contentStore.setFormField('sickImmunizer', null)
            } else if (key === 'dose') {
                contentStore.setFormField('dose', null)
            } else if (key === 'type') {
                contentStore.setFormField('type', null)
            }
        }

        /**
         * @param {Number} timeInMs
         * @returns {Promise<void>}
         */
        const wait = (timeInMs) => {
            return new Promise(
                /** @param {function(): void} resolve */
                (resolve) => {
                    setTimeout(() => {
                        resolve()
                    }, timeInMs)
                }
            )
        }

        const showCitiesSelectUpdate = async () => {
            await wait(100)
            const granValue = form.value.granularity
            if (
                granValue &&
                granValue.toLowerCase() === 'municípios' &&
                tab.value !== 'map'
            ) {
                showCitiesSelect.value = true
                return
            }
            showCitiesSelect.value = false
        }

        /**
         * @param {String} value
         */
        const disableStateCitiesSelector = (value) => {
            const formValue = form.value
            if (tab.value === 'table') {
                formValue.city = value
                if (
                    formValue.cities &&
                    formValue.cities.some((item) => item.disabled === true)
                ) {
                    formValue.cities.forEach((item) => {
                        item.disabled = false
                        item.disabledText = ''
                    })
                }
                return
            }

            if (!value) {
                return
            }

            const valueLength = value.length

            const maxSelection = 30

            if (valueLength <= maxSelection) {
                formValue.city = value
                if (
                    formValue.cities &&
                    formValue.cities.some((item) => item.disabled === true)
                ) {
                    formValue.cities.forEach((item) => {
                        item.disabled = false
                        item.disabledText = ''
                    })
                }
                if (valueLength === maxSelection) {
                    formValue.cities.forEach((item) => {
                        if (!value.includes(item.codigo6)) {
                            item.disabled = true
                            item.disabledText = 'Limite de seleções atingido'
                        }
                    })
                }
            }

            if (valueLength > maxSelection) {
                formValue.city = value.slice(0, maxSelection)
                cityTemp.value = formValue.city
                messageStore.message('info', 'Valores de seletor de municípios foram atualizado para limites de gráfico')
            }
        }

        const handleCitiesUpdateValue = (/** @type String */ value) => {
            disableStateCitiesSelector(value)
        }

        /**
         * @param {String} str
         */
        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }

        /**
         * @param {String} pattern
         * @param {{ label: string, value: string}} option
         */
        const customFilter = (pattern, option) => {
            const optionLabel = option.label || ''
            const normalizedPattern = removeAccents(pattern).toLowerCase()
            const normalizedLabel = removeAccents(optionLabel).toLowerCase()

            return normalizedLabel.includes(normalizedPattern)
        }

        /**
         * @type {(
         * payload: {
         *  node: import('vue').VNode,
         *  option: { disabledText: string, disabled: boolean }
         * }
         * ) => import('vue').VNode | string}
         */
        const renderOption = ({ node, option }) => {
            if (!option.disabled) {
                return node
            }
            return h(
                NTooltip,
                {
                    style: '',
                    delay: 500,
                },
                {
                    trigger: () => node,
                    default: () => option.disabledText,
                }
            )
        }

        // Watchers
        watch(
            () => props.isMobileScreen,
            async () => {
                const loc = form.value.local
                if (loc) {
                    citiesTemp.value = form.value.cities.filter((city) =>
                        loc.includes(city.uf)
                    )
                }
                await showCitiesSelectUpdate()
            },
            {
                deep: true,
                immediate: true,
            }
        )

        watch(
            () => form.value.local,
            (loc) => {
                localTemp.value = loc

                isLoadingCities.value = true

                setTimeout(async () => {
                    if (!loc || !loc.length) {
                        citiesTemp.value = form.value.cities
                        cityTemp.value = []
                        form.value.city = []
                    } else {
                        const rawCities = toRaw(form.value.cities)
                        const locSet = new Set(loc)

                        citiesTemp.value = rawCities.filter((city) =>
                            locSet.has(city.uf)
                        )

                        if (form.value.city?.length) {
                            const citiesTempSet = new Set(
                                citiesTemp.value.map(
                                    (/** @type {{ value:string }} */ item) =>
                                        item.value
                                )
                            )

                            const rawCityValue = toRaw(form.value.city)

                            form.value.city = rawCityValue.filter(
                                (/** @type {{ value:string }} */ itemA) =>
                                    citiesTempSet.has(itemA)
                            )
                            cityTemp.value = form.value.city
                        }

                        disableStateCitiesSelector(cityTemp.value)
                    }

                    await showCitiesSelectUpdate()
                    isLoadingCities.value = false
                }, 0)
            },
            { deep: true }
        )

        watch(
            () => form.value.cities,
            (newCities) => {
                if (!newCities) {
                    return
                }
                if (firstLoadCities.value) {
                    citiesTemp.value = newCities
                    firstLoadCities.value = false
                    for (let i = 0; i < newCities.length; i++) {
                        allCitiesValues.push(newCities[i].value)
                    }
                }
            }
        )

        watch(
            () => tab.value,
            async () => {
                disableStateCitiesSelector(cityTemp.value)
                await showCitiesSelectUpdate()
            }
        )

        watch(
            () => form.value.sickImmunizer,
            (sic) => {
                sickTemp.value = sic
            }
        )

        watch(
            () => form.value.granularity,
            async () => {
                await showCitiesSelectUpdate()
            }
        )

        onMounted(async () => {
            if (formRef.value) {
                const mainContainer = formRef.value.closest('.main')
                if (mainContainer) {
                    resizeObserver.value = new ResizeObserver(
                        updateDropdownPosition
                    )
                    resizeObserver.value.observe(mainContainer)
                }
            }
            // Update values if user is resizing window to mobile size
            if (form.value.sickImmunizer) {
              sickTemp.value = form.value.sickImmunizer
            }
            if (form.value.local) {
              localTemp.value = form.value.local
            }
            if (form.value.city) {
              cityTemp.value = form.value.city
            }
        })

        onBeforeUnmount(() => {
            sickTemp.value = form.value.sickImmunizer
            localTemp.value = form.value.local

            if (resizeObserver.value) {
                resizeObserver.value.disconnect()
            }
        })

        const updateDropdownPosition = () => {
            const key = activeSelectKey.value

            const selectedRef = selectRefsMap.value[key]
            if (key && selectedRef) {
                const activeSelect = selectedRef
                activeSelect.blur()
                nextTick(() => {
                    activeSelect.handleTriggerClick()
                })
            }
        }

        return {
            biEraser,
            citiesTemp,
            cityTemp,
            clear,
            customFilter,
            disableAll,
            disableLocalSelect,
            eraseForm,
            form,
            formRef,
            handleCitiesUpdateValue,
            handleLocalsUpdateShow,
            handleLocalsUpdateValue,
            handleShowUpdate,
            handleSicksUpdateShow,
            handleSicksUpdateValue,
            isLoadingCities,
            localTemp,
            renderOption,
            selectAllCities,
            selectAllLocals,
            selectRefsMap,
            showCitiesSelect,
            sickTemp,
            styleWidth,
            tab,
            tabBy,
            updateDatePosition,
            contentStore,
            updateDate,
        }
    },
    template: `
        <section ref="formRef" class="mct-selects" :class="isMobileScreen ? 'mct-selects--modal' : ''">
            <n-form-item :label="tabBy === 'sicks' ? 'Doença' : 'Vacina'">
                <n-select
                    :ref="el => (selectRefsMap['field1'] = el)"
                    v-model:value="sickTemp"
                    max-tag-count="responsive"
                    class="mct-select"
                    filterable
                    :style="styleWidth"
                    :consistent-menu-width="false"
                    :multiple="tab !== 'map'"
                    :on-update:show="show => handleSicksUpdateShow(show, 'field1')"
                    :on-update:value="handleSicksUpdateValue"
                    :options="tabBy === 'form.sicks' ? form.sicks : form.immunizers"
                    :placeholder="'Selecione ' + (tabBy === 'sicks' ? 'Doença' : 'Vacina')"
                    :render-option="renderOption"
                    clearable
                    :disabled="disableAll"
                    :on-clear="() => clear('sickImmunizer')"
                />
            </n-form-item>
            <n-form-item label="Dose">
                <n-select
                    :ref="el => (selectRefsMap['field2'] = el)"
                    v-model:value="form.dose"
                    class="mct-select-dose"
                    filterable
                    max-tag-count="responsive"
                    placeholder="Selecione dose"
                    :options="form.doses"
                    :style="styleWidth"
                    :render-option="renderOption"
                    clearable
                    :disabled="disableAll"
                    :on-clear="() => clear('dose')"
                    @update:show="show => handleShowUpdate(show, 'field2')"
                />
            </n-form-item>
            <n-form-item label="Tipo de dado">
                <n-select
                    :ref="el => (selectRefsMap['field3'] = el)"
                    :value="form.type"
                    @update:value="(val) => contentStore.setFormField('type', val)"
                    :consistent-menu-width="false"
                    :options="form.types"
                    class="mct-select"
                    :style="styleWidth"
                    max-tag-count="responsive"
                    placeholder="Selecione Tipo de dado"
                    filterable
                    :render-option="renderOption"
                    clearable
                    :disabled="disableAll"
                    :on-clear="() => clear('type')"
                    @update:show="show => handleShowUpdate(show, 'field3')"
                />
            </n-form-item>
            <n-form-item label="Estados">
                <n-select
                    :ref="el => (selectRefsMap['field4'] = el)"
                    v-model:value="localTemp"
                    :options="form.locals"
                    class="mct-select"
                    clearable
                    :style="styleWidth"
                    placeholder="Selecione Estado"
                    multiple
                    filterable
                    :disabled="disableAll || disableLocalSelect"
                    max-tag-count="responsive"
                    :on-update:show="show => handleLocalsUpdateShow(show, 'field4')"
                    :on-update:value="handleLocalsUpdateValue"
                >
                    <template #action>
                        <n-form-item label="Ação">
                            <n-button :on-click="() => selectAllLocals('field4')" size="small">
                                {{ (localTemp && localTemp.length === form.locals.length ? 'Desmarcar' : 'Marcar') + ' todos' }}
                            </n-button>
                        </n-form-item>
                    </template>
                </n-select>
            </n-form-item>
            <n-form-item label="Abrangência temporal" :style="isMobileScreen ? 'max-width: 400px;' : 'max-width: 200px;'">
                <n-select
                    :disabled="disableAll"
                    :options="form.years"
                    :ref="el => (selectRefsMap['field5'] = el)"
                    :value="form.periodStart"
                    @update:show="show => handleShowUpdate(show, 'field5')"
                    @update:value="(val) => updateDate('periodStart', val)"
                    class="start-datepicker"
                    clearable
                    filterable
                    placeholder="Início"
                    type="year"
                />
                <n-select
                    :disabled="disableAll"
                    :options="form.years"
                    :ref="el => (selectRefsMap['field6'] = el)"
                    :value="form.periodEnd"
                    @update:show="show => handleShowUpdate(show, 'field6')"
                    @update:value="(val) => updateDate('periodEnd', val)"
                    class="end-datepicker"
                    clearable
                    filterable
                    placeholder="Final"
                    type="year"
                />
            </n-form-item>
            <section>
                <n-form-item label="Granularidade">
                    <n-select
                        :ref="el => (selectRefsMap['field7'] = el)"
                        :options="form.granularities"
                        :value="form.granularity"
                        @update:value="(val) => contentStore.setFormField('granularity', val)"
                        class="mct-select"
                        :style="styleWidth"
                        placeholder="Selecione Granularidade"
                        clearable
                        filterable
                        :render-option="renderOption"
                        :disabled="disableAll"
                        @update:show="show => handleShowUpdate(show, 'field7')"
                        :consistent-menu-width="false"
                    />
                </n-form-item>
                <n-form-item label="Municípios" v-if="showCitiesSelect">
                    <n-space vertical>
                        <n-select
                            :consistent-menu-width="true"
                            :disabled="disableAll"
                            :options="citiesTemp"
                            :ref="el => (selectRefsMap['field8'] = el)"
                            :style="styleWidth"
                            @update:value="value => handleCitiesUpdateValue(value)"
                            @update:show="show => handleShowUpdate(show, 'field8')"
                            class="mct-select"
                            clearable
                            filterable
                            max-tag-count="responsive"
                            placeholder="Selecione Município"
                            v-model:value="cityTemp"
                            :multiple="true"
                            :filter="customFilter"
                        >
                            <template #action v-if="tab === 'table'">
                                <n-form-item label="Ação">
                                    <n-button :on-click="() => selectAllCities('field8')" size="small">
                                        {{ (cityTemp && cityTemp.length === citiesTemp.length ? 'Desmarcar' : 'Marcar') + ' todos' }}
                                        <n-spin v-show="isLoadingCities" size="tiny" :stroke-width="20" style="margin-left: 4px;" />
                                    </n-button>
                                </n-form-item>
                            </template>
                            <template #action v-else-if="tab === 'chart' && (cityTemp && cityTemp.length)">
                                <n-form-item label="Ação">
                                    <n-button
                                        :on-click="() => selectAllCities('field8', true)"
                                        size="small"
                                    >
                                        Desmarcar todos
                                        <n-spin v-if="isLoadingCities" size="tiny" :stroke-width="16" style="margin-left: 6px;" />
                                    </n-button>
                                </n-form-item>
                            </template>
                        </n-select>
                    </n-space>
                </n-form-item>
            </section>
            <n-form-item>
              <n-button title="Limpar todas as seleções" style="padding: 10px" @click="eraseForm" :disabled="disableAll">
                  <template #icon><n-icon v-html="biEraser" /></template>
              </n-button>
            </n-form-item>
        </section>
    `,
})
