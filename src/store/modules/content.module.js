import { timestampToYear, formatDate, sickImmunizerAsText, disableOptions, disableOptionsByTab } from "../../utils";
import { DataFetcher } from "../../data-fetcher";

// TODO: Detect if url is setted before set default state app to avoid unecessary API requests
const getDefaultState = () => {
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
      granularity: "Municípios",
      granularities: [],
    },
    about: null,
    aboutVaccines: null,
    titles: null,
    glossary: null,
    csvAllDataLink: null,
  }
}

export default {
  namespaced: true,
  state () {
    return getDefaultState();
  },
  actions: {
    async requestMap(
      { state },
      { map } = {}
    ) {
      const api = new DataFetcher(state.apiUrl);
      const result = await api.request(`map/${map}`);
      return result;
    },
    async updateFormSelect(
      { commit, state }
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = {};
      const options = await api.request("options");
      if (!options) {
        return;
      }
      for (let [key, value] of Object.entries(options)) {
        value.sort();
        payload[key] = value.map(x => { return { label: x, value: x } });
      }
      // Select all in locals select
      payload.locals.unshift({ label: "Todos", value: "Todos" });
      commit("UPDATE_FORM_SELECTS", payload);
    },
    async requestData(
      { state, commit },
      {
        detail = false,
        stateNameAsCode = true,
        stateTotal = false
      } = {}
    ) {
      const api = new DataFetcher(state.apiUrl);
      const form = state.form;

      if (
        form.sickImmunizer &&
        Array.isArray(form.sickImmunizer) &&
        !form.sickImmunizer.length
      ) {
        return;
      }
      // Return if form fields not filled
      if (
        !form.type ||
        !form.granularity ||
        !form.sickImmunizer ||
        (!form.periodStart && !form.periodEnd) ||
        !form.local.length
      ) {
        return;
      }

      // TODO: Add encodeURI to another fields
      const sI = Array.isArray(form.sickImmunizer) ? form.sickImmunizer.join("|") : form.sickImmunizer;
      const loc = Array.isArray(form.local) ? form.local.join("|") : form.local;
      let request ="?tabBy=" + state.tabBy + "&type=" + form.type + "&granularity=" + form.granularity +
        "&sickImmunizer=" + encodeURIComponent(sI) + "&local=" + loc;

      request += form.periodStart ? "&periodStart=" + form.periodStart : "";
      request += form.periodEnd ? "&periodEnd=" + form.periodEnd : "";
      request += form.dose ? "&dose=" + form.dose : "";

      if (detail) {
        request += "&detail=true";
      }
      if (stateTotal) {
        request += "&stateTotal=true";
      }

      const granularity = form.granularity;

      let isStateData = form.local.length > 1 && granularity !== "Região de saúde" ? "statesNames" : "citiesNames";
      if (granularity === "Região de saúde" && form.local.length > 1) {
        isStateData = "regNames";
      } else if (granularity === "Macrorregião de saúde" && form.local.length > 1) {
        isStateData = "macregnames";
      } else if (granularity === "Macrorregião de saúde") {
        isStateData = "macregnames";
      } else if (form.local.length > 1) {
        isStateData = "statesNames";
      } else {
        isStateData = "citiesNames";
      }
      const [result, localNames] = await Promise.all([
        api.request(`data/${request}`),
        api.request(isStateData)
      ]);

      if (!result || result.data.length <= 1) {
        commit("UPDATE_TITLES", null);
        this.commit("message/WARNING", "Não há dados disponíveis para os parâmetros selecionados.", { root: true });
        return { result: {}, localNames: {} }
      }

      commit("UPDATE_TITLES", result.metadata.titles);
      if (form.type !== "Doses aplicadas" && state.tab !== "chart") {
        result.data.slice(1).forEach((x, i) => x[2] = (Number(x[2]).toFixed(2) + "%"))
      } else if (form.type === "Doses aplicadas") {
        result.data.forEach((x, i) => {
          let number = x[2];
          return x[2] = i > 0 ? number.toLocaleString('pt-BR') : x[2];
        })
      }

      // Fix data to display state names as code
      if (result && (isStateData === "statesNames") && stateNameAsCode) {
        const newResult = [];
        const data = result.data;
        for (let i=1; i < data.length; i++) {
          const currentData = data[i];
          const code = localNames.find(x => x[2] === currentData[1])[0];
          currentData[1] = code;
          newResult.push(currentData);
        }
        // Add header
        newResult.unshift(data[0]);
        result.data = newResult;
      }
      return { ...result, localNames };
    },
    async requestAbout(
      { state, commit },
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = await api.request(`about`);
      commit("UPDATE_ABOUT", payload);
    },
    async requestAboutVaccines(
      { state, commit },
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = await api.request(`about-vaccines`);
      commit("UPDATE_ABOUT_VACCINES", payload);
    },
    async requestLinkCsv(
      { state, commit },
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = await api.request(`link-csv`);
      commit("UPDATE_LINK_CSV", payload);
    },
    async requestGlossary(
      { state, commit },
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = await api.request(`glossary`);
      commit("UPDATE_GLOSSARY", payload);
    }
  },
  mutations: {
    UPDATE_FORM(state, payload, commit) {
      for (let [key, value] of Object.entries(payload)){
        if (key == "periodStart") {
          state.form.period = !value && state.form.period ? state.form.periodEnd : value;
        } else if (key == "periodEnd") {
          state.form.period = state.form.periodStart ? state.form.periodStart : value;
        }
        disableOptions(state, key, value);

        state.form[key] = value;
      }
    },
    UPDATE_TITLES(state, payload) {
      state.titles = payload;
    },
    UPDATE_FORM_SELECTS(state, payload) {
      state.form = { ...state.form, ...payload };
    },
    UPDATE_ABOUT(state, payload) {
      state.about = payload;
    },
    UPDATE_ABOUT_VACCINES(state, payload) {
      state.aboutVaccines = payload;
    },
    UPDATE_LINK_CSV(state, payload) {
      state.csvAllDataLink = payload;
    },
    UPDATE_GLOSSARY(state, payload) {
      state.glossary = payload;
    },
    UPDATE_TAB(state, payload) {
      state.tab = Object.values(payload)[0];
      if (["table", "chart"].includes(Object.values(payload)[0])) {
        if (!state.form.sickImmunizer) {
          state.form.sickImmunizer = [];
        } else if (!Array.isArray(state.form.sickImmunizer)) {
          state.form.sickImmunizer = [state.form.sickImmunizer];
          this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
        }
      } else {
        if (
          state.form.sickImmunizer &&
          Array.isArray(state.form.sickImmunizer) &&
          state.form.sickImmunizer.length > 0
        ) {
          state.form.sickImmunizer = state.form.sickImmunizer[0];
          this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
        } else {
          state.form.sickImmunizer = null;
        }
      }
    },
    UPDATE_TABBY(state, payload) {
      disableOptionsByTab(state, payload);
      state.tabBy = Object.values(payload)[0];
      state.form.sickImmunizer = Array.isArray(state.form.sickImmunizer) ? [] : null;
    },
    SET_API(state, payload) {
      state.apiUrl = payload;
    },
    UPDATE_FROM_URL(state, payload) {
      for (let [key, value] of Object.entries(payload)) {
        if (key === "form") {
          for (let [formKey, formValue] of Object.entries(value)) {
            if (Array.isArray(state.form[formKey])) {
              state.form[formKey] = state.form[formKey].concat( ...state.form[formKey], formValue );
            } else {
              if (formKey === "sickImmunizer" && state.tab !== "map") {
                state.form[formKey] =  Array.isArray(formValue) ? formValue : [formValue];
              } else {
                state.form[formKey] = formValue;
              }
            }
            disableOptions(state, formKey, formValue);
          }
        } else if (key === "tabBy") {
          disableOptionsByTab(state, payload);
          state[key] = value;
        } else {
          state[key] = value;
        }
      }
    },
  },
  getters: {
    mainTitle: state => {
      let title = null;
      const form = state.form;
      if (
        form.sickImmunizer &&
        Array.isArray(form.sickImmunizer) &&
        !form.sickImmunizer.length
      ) {
        return;
      }
      // Return if form fields not filled
      if (
        !form.type ||
        !form.granularity ||
        !form.sickImmunizer ||
        !form.period ||
        !form.local.length
      ) {
        return;
      }

      if (state.titles) {
        if (state.tab === 'map' && state.titles.map) {
          title = state.titles.map?.title + " em " + form.period;
        } else {
          title = state.titles.table.title;
        }
      }
      return title;
    },
    subTitle: state => {
      let subtitle = null;
      const form = state.form;
      if (
        form.sickImmunizer &&
        Array.isArray(form.sickImmunizer) &&
        !form.sickImmunizer.length
      ) {
        return;
      }
      // Return if form fields not filled
      if (
        !form.type ||
        !form.granularity ||
        !form.sickImmunizer ||
        !form.period ||
        !form.local.length
      ) {
        return;
      }

      if (state.titles) {
        subtitle = state.tab === 'map' ? state.titles.map?.subtitle : state.titles.table.subtitle;
      }
      return subtitle;
    }
  }
}


