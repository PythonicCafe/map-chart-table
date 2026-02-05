/**
 * @typedef {Object} SelectOption
 * @property {string} label
 * @property {string|number} value
 * @property {boolean} [disabled]
 * @property {string} [disabledText]
 * @property {string} [toLowerCase]
 */

/**
 * @typedef {Object} VueState
 * @property {Object} form
 * @property {SelectOption[]} form.doses
 * @property {SelectOption[]} form.types
 * @property {SelectOption[]} form.granularities
 * @property {string|null} form.dose
 * @property {string|null} form.type
 * @property {string|string[]|Object[]} [form.sickImmunizer]
 * @property {SelectOption[]} [form.sicks]
 * @property {SelectOption[]} [form.immunizers]
 * @property {string} tabBy
 * @property {Array<Array<any>>} doseBlocks
 * @property {Array<Array<any>>} granularityBlocks
 */

/**
 * @param {string|number|Date} timestamp
 * @returns {number}
 */
export const timestampToYear = (timestamp) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    return year
}

/**
 * @param {Object} options
 * @param {string[]} options.fields
 * @param {Record<string, any>} options.store
 * @param {string} [options.base]
 * @returns {Object}
 */
export const mapFields = (options) => {
    /** @type {Record<string, any>} */
    const object = {}
    for (let i = 0; i < options.fields.length; i++) {
        const field = options.fields[i]
        object[field] = {
            get() {
                // Pinia: Acesso direto (sem .state)
                if (options.base) {
                    return options.store[options.base][field]
                }
                return options.store[field]
            },
            /** @param {any} value */
            set(value) {
                // Pinia: Atribuição direta (sem .commit)
                if (options.base) {
                    options.store[options.base][field] = value
                } else {
                    options.store[field] = value
                }
            },
        }
    }
    return object
}

/**
 * Extracts and formats the year from a given timestamp.
 *
 * @param {string|number|Date} timestamp - The timestamp to be formatted.
 * @returns {string} The year extracted from the timestamp, formatted as a four-digit string.
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const year = date.getFullYear().toString().padStart(4, '0')
    return year
}

/**
 * @param {string} dateString - The date string to be converted to UTC.
 * @returns {number} - The number representing the UTC timestamp.
 */
export const convertDateToUtc = (dateString) => {
    // @ts-ignore
    const utcDate = Date.UTC(dateString, 1, 1)
    return utcDate
}

/**
 * Converts an array of data into a table format.
 *
 * @param {string[]} data - The array of data to convert.
 * @param {string[]} localNames - Array of local names corresponding to the data.
 * @param {Object} [metadata] - Metadata object containing additional information.
 * @param {string} [metadata.type] - Type of metadata.
 * @returns {{header: Array<Object>, rows: Array<Object>}} An object containing the header and rows for the table.
 */
export const formatToTable = (data, localNames, metadata) => {
    /** @type {Array<any>} */
    let header = []
    for (const column of [...data[0], 'código']) {
        // Setting width and behaveours of table column
        let width = null
        /** @type {number|string} */
        let align = 0
        /** @type {number|null} */
        let minWidth = 200
        if (
            ['ano', 'valor', 'população', 'doses', 'código', 'dose'].includes(
                column
            )
        ) {
            align = 'right'
            width = 120
            minWidth = null
        }
        // Formating table title
        let title = column.charAt(0).toUpperCase() + column.slice(1)
        if (title === 'Doenca') {
            title = 'Doença'
        } else if (title === 'Doses') {
            title = 'Doses(qtd)'
        } else if (title === 'Dose') {
            title = 'Dose(tipo)'
        }
        header.push({
            title,
            key: column,
            sorter: ['código', 'dose'].includes(column) ? false : 'default',
            width,
            titleAlign: 'left',
            align,
            minWidth,
        })
    }

    const index = localNames[0].indexOf('geom_id')
    const indexName = localNames[0].indexOf('name')
    const indexUF = localNames[0].indexOf('uf')
    const indexAcronym = localNames[0].indexOf('acronym')
    /** @type {Array<Record<string, any>>} */
    const rows = []

    // Loop api return value
    for (let i = 1; i < data.length; i++) {
        /** @type {Record<string, any>} */
        const row = {}
        // Setting value as key: value in row object
        for (let j = 0; j < data[i].length; j++) {
            const key = header[j].key
            const value = data[i][j]
            if (key === 'local') {
                let localResult =
                    localNames.find((localName) => localName[index] == value) ||
                    localNames.find(
                        (localName) => localName[indexAcronym] == value
                    )
                if (!localResult) {
                    continue
                }
                let name = localResult[indexName]
                let ufAcronymName = localResult[indexUF]
                if (ufAcronymName) {
                    name += ' - ' + ufAcronymName
                }
                row['código'] = value
                row[header[j].key] = name
                continue
            } else if (['população', 'doses'].includes(key)) {
                // @ts-ignore
                row[header[j].key] = value.toLocaleString('pt-BR')
                continue
            } else if (
                metadata &&
                metadata.type == 'Meta atingida' &&
                key == 'valor'
            ) {
                row[header[j].key] = parseInt(value) === 1 ? 'Sim' : 'Não'
                continue
            }
            row[header[j].key] = value
        }
        // Pushing result row
        rows.push(row)
    }

    // Move Código column
    header.splice(1, 0, header.splice(7, 1)[0])
    // Move Doses (tipo) column
    header.splice(6, 0, header.splice(7, 1)[0])

    return { header, rows }
}

/**
 * Converts an array of data into an object, where each year is a key and its value is another object containing local data.
 *
 * @param {Array<Array<any>>} inputArray - The input array to convert. The first element should be the header row.
 * @returns {{header: Array<any>, data: Object}} An object containing the header and data extracted from the input array.
 */
export const convertArrayToObject = (inputArray) => {
    /** @type {Record<string, any>} */
    const data = {}

    // Loop through the input array starting from the second element
    for (let i = 1; i < inputArray.length; i++) {
        const [year, local, value, population, doses] = inputArray[i]
        if (!data[year]) {
            data[year] = {}
        }

        data[year][local] = { value, population, doses }
    }

    return { header: inputArray[0], data }
}

/**
 * Creates a debounced function.
 *
 * @returns {function(Function, number=): void} - A debounced version of the input function.
 */
export const createDebounce = () => {
    /** @type {any} */
    let timer
    return (fn, wait = 300) => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            if (typeof fn === 'function') {
                fn()
            }
        }, wait)
    }
}

/**
 * @param {string} input
 * @returns {string}
 */
export const convertToLowerCaseExceptInParentheses = (input) => {
    let result = ''
    let insideParentheses = false
    for (let i = 0; i < input.length; i++) {
        const char = input[i]
        if (char === '(') {
            insideParentheses = true
        } else if (char === ')') {
            insideParentheses = false
        }
        if (insideParentheses) {
            result += char
        } else {
            result += char.toLowerCase()
        }
    }
    return result
}

/**
 * @param {VueState['form']} form
 * @returns {[string|string[]|null, boolean]}
 */
export const sickImmunizerAsText = (form) => {
    /** @type {string|string[]|null} */
    let sickImmunizer = null
    let multipleSickImmunizer = false
    if (Array.isArray(form.sickImmunizer) && form.sickImmunizer.length > 1) {
        if (form.sickImmunizer.length > 2) {
            sickImmunizer =
                convertToLowerCaseExceptInParentheses(
                    /** @type {string[]} */ (form.sickImmunizer)
                        .slice(0, -1)
                        .join(', ')
                ) +
                ' e ' +
                convertToLowerCaseExceptInParentheses(
                    /** @type {string} */ (
                        form.sickImmunizer[form.sickImmunizer.length - 1]
                    )
                )
        } else {
            sickImmunizer = convertToLowerCaseExceptInParentheses(
                /** @type {string[]} */ (form.sickImmunizer).join(' e ')
            )
        }
        multipleSickImmunizer = true
    } else if (form.sickImmunizer && !Array.isArray(form.sickImmunizer)) {
        sickImmunizer = convertToLowerCaseExceptInParentheses(
            /** @type {string} */ (form.sickImmunizer)
        )
    } else if (Array.isArray(form.sickImmunizer) && form.sickImmunizer.length) {
        // @ts-ignore
        sickImmunizer = form.sickImmunizer.map((x) =>
            // @ts-ignore
            convertToLowerCaseExceptInParentheses(x.toLowerCase)
        )
    }

    return [sickImmunizer, multipleSickImmunizer]
}

/**
 * @param {Array<Object>} array
 * @param {Object} [object={ disabled: false }]
 */
const resetOptions = (array, object = { disabled: false }) => {
    for (let i = 0; i < array.length; i++) {
        array[i] = {
            ...array[i],
            ...object,
        }
    }
}

/*
 * TODO: Make dose selector disable field in selector type of
 * data instead of change it's data
 */

/*
 * TODO: Enhance situation where select type of data update Dose
 * field as 3ª dose
 */

/**
 * @param {VueState} state
 * @param {string} [formKey]
 * @param {any} [formValue]
 */
export const disableOptionsByTypeOrDose = (state, formKey, formValue) => {
    const disabledTextAbandono =
        'Essa informação não está disponível para 1ª dose'
    const disabledText1Dose =
        'Essa informação não está disponível para Abandono'
    if (formKey == 'type' && formValue == 'Abandono') {
        const doses = state.form.doses
        /** @type {number} */
        // @ts-ignore
        const index = doses.indexOf(doses.find((el) => el.label === '1ª dose'))
        doses[index] = {
            ...doses[index],
            disabled: true,
            disabledText: disabledTextAbandono,
        }
        const firstDoseLabel = doses[index].label
        if (
            Array.isArray(state.form.dose) &&
            state.form.dose.includes(firstDoseLabel)
        ) {
            const selectedDoseIndex = state.form.dose.findIndex(
                (item) => item === firstDoseLabel
            )
            state.form.dose.slice(0, selectedDoseIndex)
        } else if (state.form.dose == firstDoseLabel) {
            state.form.dose = null
        }
    } else if (formKey == 'type' && formValue != 'Abandono') {
        const doses = state.form.doses
        /** @type {number} */
        // @ts-ignore
        const index = doses.indexOf(doses.find((el) => el.label === '1ª dose'))
        doses[index] = {
            ...doses[index],
            disabled: false,
            disabledText: disabledText1Dose,
        }
    } else if (
        formKey == 'dose' &&
        ((!Array.isArray(formValue) && formValue == '1ª dose') ||
            (formValue && formValue.includes('1ª dose')))
    ) {
        const types = state.form.types
        /** @type {number} */
        // @ts-ignore
        const index = types.indexOf(types.find((el) => el.label == 'Abandono'))
        types[index] = {
            ...types[index],
            disabled: true,
            disabledText: disabledTextAbandono,
        }
        if (state.form.type == types[index].label) {
            state.form.type = null
        }
    } else if (
        formKey == 'dose' &&
        ((!Array.isArray(formValue) && formValue != '1ª dose') ||
            (formValue && !formValue.includes('1ª dose')))
    ) {
        const types = state.form.types
        /** @type {number} */
        // @ts-ignore
        const index = types.indexOf(types.find((el) => el.label === 'Abandono'))
        types[index] = {
            ...types[index],
            disabled: false,
            disabledText: disabledText1Dose,
        }
    } else if (!formKey) {
        // CLEAR_STATE
        const doses = state.form.doses
        const types = state.form.types
        // @ts-ignore
        doses[
            // @ts-ignore
            doses.indexOf(doses.find((el) => el.label === '1ª dose'))
        ].disabled = false
        types[
            // @ts-ignore
            types.indexOf(types.find((el) => el.label === 'Abandono'))
        ].disabled = false
    }
}

/**
 * @param {VueState} state
 * @param {Object} [payload]
 * @param {string} [payload.tabBy]
 */
export const disableOptionsByTab = (state, payload) => {
    if (payload && payload.tabBy == 'immunizers') {
        const types = state.form.types
        const index = types.indexOf(
            // @ts-ignore
            types.find((el) => el.label == 'Homogeneidade entre vacinas')
        )
        types[index] = { ...types[index], disabled: false }
    } else {
        const types = state.form.types
        const index = types.indexOf(
            // @ts-ignore
            types.find((el) => el.label == 'Homogeneidade entre vacinas')
        )
        types[index] = {
            ...types[index],
            disabled: true,
            disabledText:
                'Essa informação está disponível apenas no recorte por vacina',
        }
        if (state.form.type == types[index].label) {
            state.form.type = null
        }
    }
}

/**
 * @param {string} value
 * @returns {string}
 */
const blockHeaderName = (value) => {
    const firstLetter = value[0]
    const lastLetter = value[value.length - 1]
    return (lastLetter === 'o' ? 'r' : '') + firstLetter
}

/**
 * @param {VueState} state
 * @param {Object} [payload]
 */
export const disableOptionsByDoseOrSick = (state, payload) => {
    const sicksImmunizers =
        state.tabBy === 'sicks' ? state.form['sicks'] : state.form['immunizers']
    // @ts-ignore
    const doses = state.form.doses

    if (!payload) {
        // CLEAR_STATE
        // @ts-ignore
        resetOptions(sicksImmunizers)
        resetOptions(doses)
        return
    }

    const blockedListHeader = [...state.doseBlocks[0]]
    const blockedListRows = [...state.doseBlocks]

    // Removing header row from blockedListRows
    blockedListRows.splice(0, 1)

    const selected = Object.entries(payload)[0]
    const selectedValue = selected[1]

    const listIndexType = blockedListHeader.findIndex((el) => el === 'tipo')
    const type = state.tabBy === 'immunizers' ? 'vacina' : 'doenca'
    const listIndexSickImmuno = blockedListHeader.findIndex(
        (el) => el === 'doenca_imuno'
    )
    if (selected[0] === 'dose') {
        const selectedValuesList = Array.isArray(selectedValue)
            ? selectedValue
            : selectedValue
              ? [selectedValue]
              : []

        if (selectedValuesList.length === 0) {
            // CLEAR_STATE
            // @ts-ignore
            resetOptions(sicksImmunizers)
            return
        }

        // findAll indexes corresponding to columns of selected values
        const listIndices = selectedValuesList
            .map((val) =>
                blockedListHeader.findIndex((el) => el === blockHeaderName(val))
            )
            .filter((index) => index !== -1)

        // @ts-ignore
        for (let i = 0; i < sicksImmunizers.length; i++) {
            const blockedListRow = blockedListRows.find(
                (blr) =>
                    // @ts-ignore
                    blr[listIndexSickImmuno] === sicksImmunizers[i].label &&
                    blr[listIndexType] &&
                    blr[listIndexType]
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') === type
            )

            // Verify if blocked (false) to some of indexes found
            const isBlocked = listIndices.some(
                (index) => blockedListRow && blockedListRow[index] === false
            )

            const disabled = isBlocked ? true : false

            // @ts-ignore
            sicksImmunizers[i] = {
                // @ts-ignore
                ...sicksImmunizers[i],
                disabled,
                disabledText: 'Não selecionável para essa(s) dose(s).',
            }
        }
    } else if (selected[0] === 'sickImmunizer') {
        if (!selectedValue) {
            // CLEAR_STATE
            resetOptions(doses)
            return
        }
        let resultToBlock

        if (Array.isArray(selectedValue)) {
            resultToBlock = blockedListRows.filter(
                (blr) =>
                    selectedValue.includes(blr[listIndexSickImmuno]) &&
                    blr[listIndexType] &&
                    blr[listIndexType]
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') === type
            )
        } else {
            resultToBlock = blockedListRows.find((blr) => {
                return (
                    blr[listIndexSickImmuno] === selectedValue &&
                    blr[listIndexType] &&
                    blr[listIndexType]
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') === type
                )
            })
        }

        // Set disabled options
        for (let i = 0; i < doses.length; i++) {
            let disabled
            if (resultToBlock && Array.isArray(selectedValue)) {
                for (let result of resultToBlock) {
                    disabled = false
                    if (
                        result[
                            blockedListHeader.findIndex(
                                (el) => el === blockHeaderName(doses[i].label)
                            )
                        ] === false
                    ) {
                        disabled = true
                        break
                    }
                }
            } else if (resultToBlock) {
                // Its not a multiple values select
                disabled =
                    resultToBlock[
                        blockedListHeader.findIndex(
                            (el) => el === blockHeaderName(doses[i].label)
                        )
                    ] === true
                        ? false
                        : true
            }

            doses[i] = {
                ...doses[i],
                disabled,
                disabledText:
                    'Não selecionável para essa(s) doença(s)/vacina(s)',
            }
        }
    }

    const doseFinded = doses.find((dose) => dose.value === state.form.dose)
    if (doseFinded && doseFinded.disabled) {
        state.form.dose = null
    }
}

/**
 * @param {string} date
 * @returns {string}
 */
export const formatDatePtBr = (date) => {
    const inputDate = new Date(date + 'T00:00:00')
    // @ts-ignore
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
    // @ts-ignore
    const formatter = new Intl.DateTimeFormat('pt-BR', options)
    return formatter.format(inputDate)
}

/**
 * @param {VueState} state
 * @param {Object} [payload]
 */
export const disableOptionsByGranularityOrType = (state, payload) => {
    const granularities = state.form.granularities
    const types = state.form.types

    if (!payload) {
        // CLEAR_STATE
        resetOptions(granularities)
        resetOptions(types)
        return
    }

    const selected = Object.entries(payload)[0]
    const selectedValue = selected[1]
    const blockedListHeader = [...state.granularityBlocks[0]]
    const blockedListRows = [...state.granularityBlocks]

    // Removing header row from blockedListRows
    blockedListRows.splice(0, 1)
    const granularityColumnIndex = blockedListHeader.findIndex(
        (el) => el === 'granularidade'
    )
    const hv = 'homogeneidade_entre_vacinas'
    const hg = 'homogeneidade_geografica'
    const hvColumnIndex = blockedListHeader.findIndex((el) => el === hv)
    const hgColumnIndex = blockedListHeader.findIndex((el) => el === hg)

    if (selected[0] === 'granularity') {
        /** @type {SelectOption} */
        // @ts-ignore
        const hvOpt = types.find(
            // @ts-ignore
            (type) => strToSnakeCaseNormalize(type.value) === hv
        )
        /** @type {SelectOption} */
        // @ts-ignore
        const hgOpt = types.find(
            // @ts-ignore
            (type) => strToSnakeCaseNormalize(type.value) === hg
        )
        if (!selectedValue) {
            if (state.tabBy === 'immunizers') {
                hvOpt.disabled = false
            }
            hgOpt.disabled = false
            return
        }
        const elRow = blockedListRows.find(
            (el) => el[granularityColumnIndex] === selectedValue.toLowerCase()
        )

        if (!elRow) {
            return
        }

        if (state.tabBy === 'immunizers') {
            hvOpt.disabled = !elRow[hvColumnIndex]
            hvOpt.disabledText = 'Não selecionável para essa granularidade'
        }
        hgOpt.disabled = !elRow[hgColumnIndex]
        hgOpt.disabledText = 'Não selecionável para essa granularidade'
    } else if (selected[0] === 'type') {
        if (!selectedValue) {
            granularities.forEach(
                (granularity) => (granularity.disabled = false)
            )
            return
        }
        const listIndex = blockedListHeader.findIndex(
            (el) => el === strToSnakeCaseNormalize(selectedValue)
        )
        if (listIndex < 1) {
            granularities.forEach(
                (granularity) => (granularity.disabled = false)
            )
            return
        }
        /** @type {any[]} */
        const resultToBlock = []
        blockedListRows.forEach((el) => {
            if (!el[listIndex]) {
                resultToBlock.push(el[granularityColumnIndex])
            }
        })
        granularities.forEach((granularity) => {
            if (
                resultToBlock.includes(String(granularity.value).toLowerCase())
            ) {
                granularity.disabled = true
                granularity.disabledText =
                    'Não selecionável para essa tipo de dado'
                return
            }
            granularity.disabled = false
        })
    }
}

/**
 * Check if array have same content
 * @param {string[]} arr1
 * @param {string[]} arr2
 *
 * @return boolean
 */
export const arraysSameContent = (arr1, arr2) => {
    if (arr1 === arr2) return true
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return false

    const str1 = JSON.stringify([...arr1].sort())
    const str2 = JSON.stringify([...arr2].sort())

    return str1 === str2
}

/**
 * @param {string} str
 * @returns {string}
 */
const strToSnakeCaseNormalize = (str) =>
    str
        .toLowerCase()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
