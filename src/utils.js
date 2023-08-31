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

export const formatToTable = (data, localNames) => {
  const header = [];
  for (const column of [...data[0]]) {
    header.push(
      {
        title: column.charAt(0).toUpperCase() + column.slice(1),
        key: column,
        sorter: 'default',
        width: 200,
      }
    )
  }

  const rows = [];
  // Loop api return value
  for (let i = 1; i < data.length; i++) {  
    const row = {};
    // Setting value as key: value in row object
    for (let j = 0; j < data[i].length; j++) {
      const key = header[j].key;
      const value = data[i][j];
      if (key === "local") {
        const localResult = localNames[value.toString()];
        let name = localResult.name;
        if (localResult.uf) {
          name += " - " + localResult.uf
        }
        row[header[j].key] = name;
        continue;
      }
      row[header[j].key] = value;
    }
    // Pushing result row
    rows.push(row)
  }

  return { header, rows }
}

export const convertArrayToObject = (inputArray) => {
  const data = {};

  // Loop through the input array starting from the second element
  for (let i = 1; i < inputArray.length; i++) {
    const [year, local, value] = inputArray[i];
    if (!data[year]) {
      data[year] = {};
    }
    data[year][local] = value;
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
