export const getDefaultState = () => {
  return {
    apiUrl: "",
    tab: "map",
    tabBy: "sicks",
    legend: "Fonte: Programa Nacional de Imunização (PNI), disponibilizadas no TabNet-DATASUS",
    form: {
      sickImmunizer: null,
      sicks: [],
      immunizers: [],
      type: null,
      types: [],
      local: [],
      locals: [],
      dose: null,
      doses: [],
      period: null,
      years: null,
      periodStart: null,
      periodEnd: null,
      granularity: null,
      granularities: [],
    },
    about: null,
    aboutVaccines: null,
    titles: null,
    glossary: null,
    csvAllDataLink: null,
    disableMap: false,
    disableChart: false
  }
}
