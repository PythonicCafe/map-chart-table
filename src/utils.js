export const timestampToYear = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  return year;
};

export const mapFields = (options) => {
  const object = {};
  for (let i = 0; i < options.fields.length; i++) {
    const field = [options.fields[i]];
    object[field] = {
      get() {
        return options.store.state[options.base][field];
      },
      set(value) {
        options.store.commit(options.mutation, { [field]: value });
      }
    };
  }
  return object;
}

export const computedVar = (options) => {
  return {
    get() {
      if (options.base) {
        return options.store.state.content[options.base][options.field];
      }
      return options.store.state.content[options.field];
    },
    set(value) {
      options.store.commit(options.mutation, { [options.field]: value });
    }
  }
}

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear().toString().padStart(4, "0");
  return `${year}`;
};

export const convertDateToUtc = (dateString) => {
  const utcdate = Date.UTC(dateString, 1, 1);
  return utcdate;
};

export const formatToTable = (data, localNames, metadata) => {
  let header = [];
  for (const column of [...data[0], "código"]) {
    // Setting width and behaveours of table column
    let width = null;
    let align = 0;
    let minWidth = 200;
    if (["ano", "valor", "população", "doses", "código"].includes(column)) {
      align = "right";
      width = 120;
      minWidth = null;
    }
    // Formating table title
    let title = column.charAt(0).toUpperCase() + column.slice(1);
    if (title === "Doenca") {
      title = "Doença";
    }
    header.push(
      {
        title,
        key: column,
        sorter: 'default',
        width,
        titleAlign: "left",
        align,
        minWidth,
      }
    )
  }

  const index = localNames[0].indexOf("geom_id");
  const indexName = localNames[0].indexOf("name");
  const indexUF = localNames[0].indexOf("uf");
  const rows = [];

  // Loop api return value
  for (let i = 1; i < data.length; i++) {
    const row = {};
    // Setting value as key: value in row object
    for (let j = 0; j < data[i].length; j++) {
      const key = header[j].key;
      const value = data[i][j];
      if (key === "local") {
        const localResult = localNames.find(localName => localName[index] == value);
        if (!localResult) {
          continue
        }
        let name = localResult[indexName];
        let ufAcronymName = localResult[indexUF];
        if (ufAcronymName) {
          name += " - " + ufAcronymName
        }
        row["código"] = value;
        row[header[j].key] = name;
        continue;
      } else if (["população", "doses"].includes(key)) {
        row[header[j].key] = value.toLocaleString("pt-BR");
        continue
      } else if (metadata.type == "Meta atingida" && key == "valor") {
        row[header[j].key] = parseInt(value) === 1 ? "Sim" : "Não";
        continue
      }
      row[header[j].key] = value;
    }
    // Pushing result row
    rows.push(row)
  }

  header.splice(1, 0, header.splice(6, 1)[0]);

  return { header, rows }
}

export const convertArrayToObject = (inputArray) => {
  const data = {};

  // Loop through the input array starting from the second element
  for (let i = 1; i < inputArray.length; i++) {
    const [year, local, value, population, doses] = inputArray[i];
    if (!data[year]) {
      data[year] = {};
    }

    data[year][local] = { value, population, doses };
  }

  return { header:inputArray[0], data };
}

export const createDebounce = () => {
  let timer;
  return (fn, wait = 300) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (typeof fn === "function") {
        fn();
      }
    }, wait);
  };
};

export const convertToLowerCaseExceptInParentheses = (input) => {
  let result = '';
  let insideParentheses = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '(') {
      insideParentheses = true;
    } else if (char === ')') {
      insideParentheses = false;
    }
    if (insideParentheses) {
      result += char;
    } else {
      result += char.toLowerCase();
    }
  }
  return result;
}

export const sickImmunizerAsText = (form) => {
  let sickImmunizer = null;
  let multipleSickImmunizer = false;
  if (Array.isArray(form.sickImmunizer) && form.sickImmunizer.length > 1) {
    if(form.sickImmunizer.length > 2) {
      sickImmunizer = convertToLowerCaseExceptInParentheses(form.sickImmunizer.slice(0, -1).join(', ')) + " e " +
        convertToLowerCaseExceptInParentheses(form.sickImmunizer[form.sickImmunizer.length - 1]);
    } else {
      sickImmunizer =  convertToLowerCaseExceptInParentheses(form.sickImmunizer.join(" e "));
    }
    multipleSickImmunizer = true;
  } else if (form.sickImmunizer && !Array.isArray(form.sickImmunizer)) {
    sickImmunizer =  convertToLowerCaseExceptInParentheses(form.sickImmunizer);
  } else if (Array.isArray(form.sickImmunizer) && form.sickImmunizer.length)  {
    sickImmunizer = form.sickImmunizer.map(x => convertToLowerCaseExceptInParentheses(x.toLowerCase));
  }

  return [ sickImmunizer, multipleSickImmunizer ];
}

const resetOptions = (array, object = { disabled: false }) => {
  for (let i=0; i < array.length; i++) {
    array[i] = {
      ...array[i],
      ...object
    };
  }
}

export const disableOptionsByTypeOrDose = (state, formKey, formValue) => {
  const disabledTextAbandono = "Essa informação não está disponível para 1ª dose";
  const disabledText1Dose = "Essa informação não está disponível para Abandono";
  if (formKey == "type" && formValue == "Abandono")  {
    const doses = state.form.doses;
    const index = doses.indexOf(doses.find(el => el.label === "1ª dose"));
    doses[index] = { ...doses[index], disabled: true, disabledText: disabledTextAbandono };
    if (state.form.dose == doses[index].label) {
      state.form.dose = null;
    }
  } else if (formKey == "type" && formValue != "Abandono") {
    const doses = state.form.doses;
    const index = doses.indexOf(doses.find(el => el.label === "1ª dose"));
    doses[index] = { ...doses[index], disabled: false, disabledText: disabledText1Dose }
  } else if (formKey == "dose" && formValue == "1ª dose")  {
    const types = state.form.types;
    const index = types.indexOf(types.find(el => el.label == "Abandono"));
    types[index] = { ...types[index], disabled: true, disabledText: disabledTextAbandono };
    if (state.form.type == types[index].label) {
      state.form.type = null;
    }
  } else if (formKey == "dose" && formValue != "1ª dose") {
    const types = state.form.types;
    const index = types.indexOf(types.find(el => el.label === "Abandono"));
    types[index] = { ...types[index], disabled: false, disabledText: disabledText1Dose }
  } else if (!formKey){ // CLEAR_STATE
    const doses = state.form.doses;
    const types = state.form.types;
    doses[doses.indexOf(doses.find(el => el.label === "1ª dose"))].disabled = false
    types[types.indexOf(types.find(el => el.label === "Abandono"))].disabled = false
  }
}

export const disableOptionsByTab = (state, payload) => {
  if (payload && payload.tabBy == "immunizers") {
    const types = state.form.types;
    const index = types.indexOf(types.find(el => el.label == "Homogeneidade entre vacinas"));
    types[index] = { ...types[index], disabled: false };
  } else {
    const types = state.form.types;
    const index = types.indexOf(types.find(el => el.label == "Homogeneidade entre vacinas"));
    types[index] = {
      ...types[index],
      disabled: true,
      disabledText: "Essa informação está disponível apenas no recorte por vacina"
    };
    if (state.form.type == types[index].label) {
      state.form.type = null;
    }
  }
}

const blockHeaderName = (value) => {
  const firstLetter = value[0];
  const lastLetter = value[value.length - 1];
  return (lastLetter === "o" ? "R" : "") + firstLetter;
}

export const disableOptionsByDoseOrSick = (state, payload) => {
  const sicksImmunizers = state.tabBy === "sicks" ? state.form['sicks'] : state.form['immunizers'];
  const doses = state.form.doses;

  if(!payload) { // CLEAR_STATE
    resetOptions(sicksImmunizers);
    resetOptions(doses);
    return;
  }

  const blockedListHeader = [...state.doseBlocks[0]];
  const blockedListRows = [...state.doseBlocks];

  // Removing header row from blockedListRows
  blockedListRows.splice(0, 1);

  const selected = Object.entries(payload)[0];
  const selectedValue = selected[1];

  if (selected[0] === "dose") {
    if(!selectedValue) { // CLEAR_STATE
      resetOptions(sicksImmunizers);
      return;
    }
    const listIndex = blockedListHeader.findIndex(el => el === blockHeaderName(selectedValue));
    for (let i=0; i < sicksImmunizers.length; i++) {
      const blockedListRow = blockedListRows.find(blr => blr[0] === sicksImmunizers[i].label);
      const disabled = blockedListRow && blockedListRow[listIndex] === false ? true : false;
      sicksImmunizers[i] = {
        ...sicksImmunizers[i],
        disabled,
        disabledText: "Não selecionável para essa dose."
      };
    }
  } else if (selected[0] === "sickImmunizer") {
    if(!selectedValue) { // CLEAR_STATE
      resetOptions(doses);
      return;
    }
    const listIndex = blockedListHeader.findIndex(el => el === 'doenca_imuno');
    let resultToBlock;

    if (Array.isArray(selectedValue)) {
      resultToBlock = blockedListRows.filter(el => selectedValue.includes(el[listIndex]));
    } else {
      resultToBlock = blockedListRows.find(el => el[listIndex] === selectedValue);
    }

    for (let i=0; i < doses.length; i++) {
      let disabled;
      if (resultToBlock && Array.isArray(selectedValue)) {
        for(let result of resultToBlock) {
          disabled = false;
          if (
              result[
                blockedListHeader.findIndex(el => el === blockHeaderName(doses[i].label))
              ] === false
          ) {
            disabled = true;
            break;
          }
        }
      } else if (resultToBlock){ // Its not a multiple values select
        disabled = resultToBlock[
          blockedListHeader.findIndex(el => el === blockHeaderName(doses[i].label))
        ] === true ? false : true;
      }

      doses[i] = {
        ...doses[i],
        disabled,
        disabledText: "Não selecionável para essa doença/vacina"
      };
    }
  }

  const doseFinded = doses.find(dose => dose.value === state.form.dose);
  if (doseFinded && doseFinded.disabled) {
    state.form.dose = null;
  }
}

export const formatDatePtBr = (date) => {
  const inputDate = new Date(date + "T00:00:00");
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  return formatter.format(inputDate);
}

export const disableOptionsByGranularityOrType = (state, payload) => {
  const granularities = state.form.granularities;
  const types = state.form.types;

  if (!payload) { // CLEAR_STATE
    resetOptions(granularities);
    resetOptions(types);
    return;
  }

  const selected = Object.entries(payload)[0];
  const selectedValue = selected[1];
  const blockedListHeader = [...state.granularityBlocks[0]];
  const blockedListRows = [...state.granularityBlocks];

  // Removing header row from blockedListRows
  blockedListRows.splice(0, 1);
  const granularityColumnIndex = blockedListHeader.findIndex(el => el === "granularidade");
  const hv = "homogeneidade_entre_vacinas";
  const hg = "homogeneidade_geografica";
  const hvColumnIndex = blockedListHeader.findIndex(el => el === hv);
  const hgColumnIndex = blockedListHeader.findIndex(el => el === hg);

  if (selected[0] === "granularity") {
    const hvOpt = types.find(type => strToSnakeCaseNormalize(type.value) === hv);
    const hgOpt = types.find(type => strToSnakeCaseNormalize(type.value) === hg);
    if (!selectedValue) {
      if (state.tabBy === "immunizers") {
        hvOpt.disabled = false;
      }
      hgOpt.disabled = false;
      return;
    }
    const elRow = blockedListRows.find(el =>
      el[granularityColumnIndex] === selectedValue.toLowerCase()
    );
    if (state.tabBy === "immunizers") {
      hvOpt.disabled = !elRow[hvColumnIndex];
      hvOpt.disabledText = "Não selecionável para essa granularidade";
    }
    hgOpt.disabled = !elRow[hgColumnIndex];
    hgOpt.disabledText = "Não selecionável para essa granularidade";

  } else if (selected[0] === "type") {
    if (!selectedValue) {
      granularities.forEach(granularity => granularity.disabled = false)
      return;
    }
    const listIndex = blockedListHeader.findIndex(el => el === strToSnakeCaseNormalize(selectedValue));
    if (listIndex < 1) {
      granularities.forEach(granularity => granularity.disabled = false)
      return
    }
    const resultToBlock = [];
    blockedListRows.forEach(el => {
      if (!el[listIndex]) {
        resultToBlock.push(el[granularityColumnIndex]);
      }
    });
    granularities.forEach(granularity => {
      if (resultToBlock.includes(granularity.value.toLowerCase())) {
        granularity.disabled = true;
        granularity.disabledText = "Não selecionável para essa tipo de dado";
        return;
      }
      granularity.disabled = false;
    })
  }
}

const strToSnakeCaseNormalize = (str) =>
  str.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
