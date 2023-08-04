export const randomHexColor = (stringInput) => {
    let stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}

export const textToHex = (text) => {
  const codePoints = text.split("").map(c => c.charCodeAt(0));
  const hexCodes = codePoints.map(c => c.toString(16).padStart(2, "0"));
  return hexCodes.join("");
}

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
        return options.store.state[options.base][options.field];
      }
      return options.store.state[options.field];
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

export const convertObjectToArrayTable = (
  obj,
  locals,
  years,
  sicks,
  header = ['Ano', 'Sigla', 'Nome', 'Valor']
) => {
  const result = [];
  let externalObj = obj;
  if (!externalObj[sicks[0]]) {
    externalObj = { [sicks[0]]: externalObj };
  }
  result.push(header);

  // Loop through each year
  for (const sickName of sicks) {
    for (const year of years) {
      if (externalObj[sickName]) {
        // Loop through each state in the year
        for (const acronym of locals) {
          const value = externalObj[sickName][year] &&
            externalObj[sickName][year][acronym] ? externalObj[sickName][year][acronym] : null;
          if (value){
            result.push([year, acronym, sickName, value + "%"]);
          }
        }
      }
    }
  }

  return result;
}
