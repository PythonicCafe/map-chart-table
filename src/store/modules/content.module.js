import { timestampToYear, formatDate, sickImmunizerAsText, disableOptionsByTypeAndDose, disableOptionsByTab } from "../../utils";
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

      const states = form.local;

      let isStateData;
      if (granularity === "Região de saúde" && states.length > 1) {
        isStateData = "regNames";
      } else if (granularity === "Macrorregião de saúde") {
        isStateData = "macregnames";
      } else if (granularity === "Região de saúde") {
        isStateData = "regnames";
      } else if (granularity === "Estados") {
        isStateData = "statesNames";
      } else {
        isStateData = "citiesNames";
      }

      const [result, localNames] = await Promise.all([
        api.request(`data/${request}`),
        api.request(isStateData)
      ]);

      if (result.error) {
        this.commit("message/ERROR", "Não foi possível carregar os dados. Tente novamente mais tarde.", { root: true });
        return { result: {}, localNames: {} }
      } else if (!result || result.data && result.data.length <= 1) {
        commit("UPDATE_TITLES", null);
        this.commit("message/WARNING", "Não há dados disponíveis para os parâmetros selecionados.", { root: true });
        return { result: {}, localNames: {} }
      } else {
        commit("UPDATE_TITLES", result.metadata.titles);
      }

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
          const code = localNames.find(x => x[1] === currentData[1])[0];
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
      const payload = await api.requestSettingApiEndPoint("?slug=sobre-vacinabr", "/wp-json/wp/v2/pages");
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
    UPDATE_FORM(state, payload) {
      for (let [key, value] of Object.entries(payload)){
        if (key === "periodStart") {
          if (!value && state.form.periodEnd) {
            state.form.period = state.form.periodEnd;
          } else {
            state.form.period = value;
          }
        } else if (key === "periodEnd" && !state.form.periodStart) {
          // If update and not periodStart, set period as periodEnd value
          state.form.period = value;
        }
        disableOptionsByTypeAndDose(state, key, value);

        state.form[key] = value;
      }

      this.commit("content/CHECK_GRAN_WITH_LOCAL");
    },
    CHECK_GRAN_WITH_LOCAL(state, payload) {
      // Granularities logic
      if (
        state.form.granularity === "Municípios" &&
        state.form.local.length > 1
      ) {
        if (["map", "chart"].includes(state.tab)) {
          this.commit("content/UPDATE_TAB", { tab: "table" });
        }
        state.disableMap = true;
        state.disableChart = true;
      } else if (
        state.form.granularity === "Municípios" ||
        state.form.type === "Meta atingida"
      ) {
        if (state.tab === "chart") {
          this.commit("content/UPDATE_TAB", { tab: "table" });
        }
        state.disableMap = false;
        state.disableChart = true;
      } else {
        state.disableMap = false;
        state.disableChart = false;
      }
    },
    UPDATE_TITLES(state, payload) {
      state.titles = payload;
    },
    UPDATE_FORM_SELECTS(state, payload) {
      for (let [key, value] of Object.entries(payload)) {
        state.form[key] = value;
      }
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
      } else if (
        state.form.sickImmunizer &&
        Array.isArray(state.form.sickImmunizer) &&
        state.form.sickImmunizer.length > 0
      ) {
        state.form.sickImmunizer = state.form.sickImmunizer[0];
        this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
      } else {
        state.form.sickImmunizer = null;
      }

      this.commit("content/CHECK_GRAN_WITH_LOCAL");
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
            } else if (formKey === "sickImmunizer" && state.tab !== "map") {
              state.form[formKey] =  Array.isArray(formValue) ? formValue : [formValue];
            } else {
              state.form[formKey] = formValue;
            }
            disableOptionsByTypeAndDose(state, formKey, formValue);
          }
        } else if (key === "tabBy") {
          disableOptionsByTab(state, payload);
          state[key] = value;
        } else {
          state[key] = value;
        }
      }
      this.commit("content/CHECK_GRAN_WITH_LOCAL");
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
    },
    selectsPopulated: state => {
      const form = state.form;
      if (
        form.sickImmunizer &&
        form.type &&
        form.local.length &&
        form.period &&
        form.granularity
      ) {
        return true;
      }
      return false;
    }
  }
}


