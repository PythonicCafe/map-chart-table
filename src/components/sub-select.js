import {
    ref,
    watch,
    computed,
    toRaw,
    onBeforeMount,
    onMounted,
    h,
    reactive,
    nextTick,
} from 'vue/dist/vue.esm-bundler'
import {
    NSelect,
    NFormItem,
    NDatePicker,
    NButton,
    NTooltip,
    NIcon,
    NSpin,
    NSpace,
} from 'naive-ui'
import { useStore } from 'vuex'
import { computedVar } from '../utils'
import { biEraser } from '../icons.js'

export const subSelect = {
    components: {
        NSelect,
        NFormItem,
        NDatePicker,
        NButton,
        NIcon,
        NSpin,
        NSpace,
    },
    props: {
        modal: {
            default: false,
            type: Boolean,
        },
    },
    setup(props) {
        const allCitiesValues = []
        const store = useStore()
        const tab = computed(() => store.state.content.tab)
        const tabBy = computed(() => store.state.content.tabBy)
        const cityTemp = ref(null)
        const sickTemp = ref(null)
        const localTemp = ref(null)
        const citiesTemp = ref([])
        const disableLocalSelect = computed(
            () => store.getters[`content/disableLocalSelect`]
        )
        const sick = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'sickImmunizer',
            })
        )
        const sicks = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'sicks',
            })
        )
        const immunizers = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'immunizers',
            })
        )
        const type = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'type',
            })
        )
        const types = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'types',
            })
        )
        const local = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'local',
            })
        )
        const locals = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'locals',
            })
        )
        const dose = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'dose',
            })
        )
        const doses = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'doses',
            })
        )
        const period = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'period',
            })
        )
        const granularity = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'granularity',
            })
        )
        const granularities = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'granularities',
            })
        )
        const periodStart = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'periodStart',
            })
        )
        const periodEnd = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'periodEnd',
            })
        )
        const years = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'years',
            })
        )
        const city = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'city',
            })
        )
        const cities = computed(
            computedVar({
                store,
                base: 'form',
                mutation: 'content/UPDATE_FORM',
                field: 'cities',
            })
        )
        const selectRefsMap = reactive({})
        const resizeObserver = ref(null)
        const isLoadingCities = ref(false)
        const firstLoadCities = ref(true)

        const activeSelectKey = ref(null)
        const formRef = ref(null)

        const showingLocalsOptions = ref(null)
        const showingSicksOptions = ref(null)

        const updateDatePosition = () => {
            const endDate = periodEnd.value
            const startDate = periodStart.value
            const tsEndDate = endDate
            const tsStartDate = startDate
            if (!tsStartDate || !tsEndDate) {
                return
            }
            if (tsStartDate > tsEndDate) {
                periodEnd.value = startDate
                periodStart.value = endDate
            }
        }

        const selectAllLocals = (field) => {
            const allOptions = toRaw(locals.value)
            const selectLength = Array.isArray(localTemp.value)
                ? localTemp.value.length
                : null
            if (selectLength == allOptions.length) {
                localTemp.value = []
                handleShowUpdate(true, field)
                return
            }

            localTemp.value = allOptions.map((option) => option.value)
            handleShowUpdate(true, field)
        }

        const selectAllCities = (field, uncheckAll = false) => {
            if (isLoadingCities.value) {
                return
            }
            isLoadingCities.value = true

            // We use setTimeout to run this code after Vue render process
            setTimeout(() => {
                const allOptions = toRaw(citiesTemp.value)
                const selectLength = Array.isArray(cityTemp.value)
                    ? cityTemp.value.length
                    : null

                if (selectLength == allOptions.length || uncheckAll) {
                    city.value = []
                    cityTemp.value = []
                    handleShowUpdate(true, field)
                    isLoadingCities.value = false
                    return
                }

                city.value = allCitiesValues
                cityTemp.value = allCitiesValues

                handleShowUpdate(true, field)
                isLoadingCities.value = false
            }, 0)
        }

        const handleLocalsUpdateShow = (show, field) => {
            showingLocalsOptions.value = show
            if (!showingLocalsOptions.value && localTemp.value) {
                local.value = localTemp.value
            }
            handleShowUpdate(show, field)
        }

        const handleLocalsUpdateValue = (value) => {
            localTemp.value = value
            if (!showingLocalsOptions.value && localTemp.value) {
                local.value = localTemp.value
            }
            // Close hover box options remover
            // const nPopover = document.querySelector(".n-popover");
            // if (nPopover) {
            //  nPopover.innerHTML = "<!---->";
            // }
        }

        const handleSicksUpdateShow = (show, field) => {
            showingSicksOptions.value = show

            if (
                !showingSicksOptions.value &&
                sickTemp.value &&
                tab.value !== 'map'
            ) {
                sick.value = sickTemp.value
            }
            handleShowUpdate(show, field)
        }

        const handleSicksUpdateValue = (value) => {
            sickTemp.value = value
            if (!showingSicksOptions.value && sickTemp.value) {
                sick.value = value
            }
            // Close hover box options remover
            // const nPopover = document.querySelector(".n-popover");
            // if (nPopover) {
            //  nPopover.innerHTML = "<!---->";
            // }
        }

        const eraseForm = () => {
            store.commit('content/CLEAR_STATE')
        }

        const clear = (key) => {
            if (key === 'sickImmunizer') {
                sickTemp.value = null
                sick.value = null
            } else if (key === 'dose') {
                dose.value = null
            } else if (key === 'type') {
                type.value = null
            }
        }

        const styleWidth = props.modal ? 'width: 400px;' : 'width: 200px;'

        watch(
            () => props.modal,
            () => {
                const loc = store.state.content.form.local
                if (loc) {
                    citiesTemp.value = cities.value.filter((city) =>
                        loc.includes(city.uf)
                    )
                }
            },
            { deep: true, immediate: true }
        )

        watch(
            () => store.state.content.form.local,
            (loc) => {
                localTemp.value = loc

                isLoadingCities.value = true

                setTimeout(async () => {
                    if (!loc.length) {
                        citiesTemp.value = cities.value
                        cityTemp.value = []
                        city.value = []
                    } else {
                        const rawCities = toRaw(cities.value)
                        const locSet = new Set(loc)

                        citiesTemp.value = rawCities.filter((city) =>
                            locSet.has(city.uf)
                        )

                        if (city.value?.length) {
                            const citiesTempSet = new Set(
                                citiesTemp.value.map((item) => item.value)
                            )

                            const rawCityValue = toRaw(city.value)

                            city.value = rawCityValue.filter((itemA) =>
                                citiesTempSet.has(itemA)
                            )
                            cityTemp.value = city.value
                        }

                        disableStateCitiesSelector(cityTemp.value)
                    }

                    await showCitiesSelectUpdate()
                    isLoadingCities.value = false
                }, 0)
            }
        )

        watch(
            () => store.state.content.form.cities,
            (cities) => {
                if (firstLoadCities.value) {
                    citiesTemp.value = cities
                    firstLoadCities.value = false
                    for (let i = 0; i < cities.length; i++) {
                        allCitiesValues.push(cities[i].value)
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
            () => store.state.content.form.sickImmunizer,
            (sic) => {
                sickTemp.value = sic
            }
        )

        watch(
            () => granularity.value,
            async () => {
                await showCitiesSelectUpdate()
            }
        )

        onBeforeMount(() => {
            sickTemp.value = store.state.content.form.sickImmunizer
            localTemp.value = store.state.content.form.local
        })

        const handleShowUpdate = (show, key) => {
            if (show) {
                activeSelectKey.value = key
            } else if (activeSelectKey.value === key) {
                activeSelectKey.value = null
            }
        }

        const updateDropdownPosition = () => {
            const key = activeSelectKey.value

            const selectedRef = selectRefsMap[key]
            if (key && selectedRef) {
                const activeSelect = selectedRef
                activeSelect.blur()
                nextTick(() => {
                    activeSelect.handleTriggerClick()
                })
            }
        }

        const disableStateCitiesSelector = (value) => {
            if (tab.value === 'table') {
                city.value = value
                if (cities.value.some((item) => item.disabled === true)) {
                    cities.value.forEach((item) => {
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
                city.value = value
                if (cities.value.some((item) => item.disabled === true)) {
                    cities.value.forEach((item) => {
                        item.disabled = false
                        item.disabledText = ''
                    })
                }
                if (valueLength === maxSelection) {
                    cities.value.forEach((item) => {
                        if (!value.includes(item.codigo6)) {
                            item.disabled = true
                            item.disabledText = 'Limite de seleções atingido'
                        }
                    })
                }
            }

            if (valueLength > maxSelection) {
                city.value = value.slice(0, maxSelection)
                cityTemp.value = city.value
                store.commit(
                    'message/INFO',
                    'Valores de seletor de municípios foram atualizado para limites de gráfico'
                )
            }
        }

        const handleCitiesUpdateValue = (value) => {
            disableStateCitiesSelector(value)

            return
        }

        onMounted(() => {
            if (formRef.value) {
                resizeObserver.value = new ResizeObserver(
                    updateDropdownPosition
                )
                resizeObserver.value.observe(formRef.value.closest('.main'))
            }
        })
        const wait = (timeInMs) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve()
                }, timeInMs)
            })
        }

        const showCitiesSelect = ref(false)

        const showCitiesSelectUpdate = async () => {
            await wait(100)
            const granValue = granularity.value
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

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }

        const customFilter = (pattern, option) => {
            const optionLabel = option.label || ''
            const normalizedPattern = removeAccents(pattern).toLowerCase()
            const normalizedLabel = removeAccents(optionLabel).toLowerCase()

            return normalizedLabel.includes(normalizedPattern)
        }

        return {
            biEraser,
            cities,
            citiesTemp,
            city,
            cityTemp,
            clear,
            customFilter,
            disableAll: computed(() => store.state.content.yearSlideAnimation),
            disableLocalSelect,
            dose,
            doses,
            eraseForm,
            formRef,
            granularities,
            granularity,
            handleCitiesUpdateValue,
            handleLocalsUpdateShow,
            handleLocalsUpdateValue,
            handleShowUpdate,
            handleSicksUpdateShow,
            handleSicksUpdateValue,
            immunizers,
            isLoadingCities,
            local,
            localTemp,
            locals,
            period,
            periodEnd,
            periodStart,
            selectAllCities,
            selectAllLocals,
            selectRefsMap,
            sick,
            sickTemp,
            sicks,
            styleWidth,
            tab,
            tabBy,
            type,
            types,
            updateDatePosition,
            years,
            showCitiesSelect,
            modalContentGlossary: computed(() => {
                const text = store.state.content.about
                let result = ''
                // TODO: Links inside text should be clickable
                for (let [key, val] of Object.entries(text)) {
                    let validUrl = null
                    let valFomated = val.replace(/\n/gi, '<br><br>')
                    try {
                        validUrl = new URL(val)
                    } catch (e) {
                        //Do nothing
                    }
                    if (validUrl) {
                        valFomated = `<a href="${valFomated}" target="about:blank" style="color: #e96f5f">Acessar arquivo</a>`
                    }
                    result += `<h2 style="margin-bottom: 12px">${key}</h2><p>${valFomated}</p>`
                }
                return result
            }),
            renderOption: ({ node, option }) => {
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
            },
        }
    },
    template: `
    <section ref="formRef" class="mct-selects" :class="modal ? 'mct-selects--modal' : ''">
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
          :options="tabBy === 'sicks' ? sicks : immunizers"
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
          v-model:value="dose"
          class="mct-select-dose"
          filterable
          max-tag-count="responsive"
          placeholder="Selecione dose"
          :options="doses"
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
          v-model:value="type"
          :consistent-menu-width="false"
          :options="types"
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
          :options="locals"
          class="mct-select"
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
                {{ (localTemp && localTemp.length === locals.length  ? 'Desmarcar' : 'Marcar') + ' todos' }}
              </n-button>
            </n-form-item>
          </template>
        </n-select>
      </n-form-item>
      <n-form-item label="Abrangência temporal" :style="modal ? 'max-width: 400px;' : 'max-width: 200px;'">
        <n-select
         :ref="el => (selectRefsMap['field5'] = el)"
         class="start-datepicker"
         v-model:value="periodStart"
         :options="years"
         type="year"
         placeholder="Início"
         filterable
         @update:value="updateDatePosition"
         clearable
         :disabled="disableAll"
         @update:show="show => handleShowUpdate(show, 'field5')"
        />
        <n-select
         :ref="el => (selectRefsMap['field6'] = el)"
         class="end-datepicker"
         v-model:value="periodEnd"
         :options="years"
         type="year"
         placeholder="Final"
         filterable
         @update:value="updateDatePosition"
         clearable
         :disabled="disableAll"
         @update:show="show => handleShowUpdate(show, 'field6')"
        />
      </n-form-item>
      <section>
        <n-form-item label="Granularidade">
          <n-select
            :ref="el => (selectRefsMap['field7'] = el)"
            v-model:value="granularity"
            :options="granularities"
            class="mct-select"
            :style="styleWidth"
            placeholder="Selecione Granularidade"
            clearable
            filterable
            :render-option="renderOption"
            :disabled="disableAll"
            @update:show="show => handleShowUpdate(show, 'field7')"
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
                    {{ (cityTemp && cityTemp.length === citiesTemp.length  ? 'Desmarcar' : 'Marcar') + ' todos' }}
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
}
