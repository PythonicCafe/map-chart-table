import { DataFetcher } from "../../../data-fetcher";

export default {
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

    // Return if form field sickImmunizer is a multiple select and is empty
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
      !form.dose ||
      (!form.periodStart && !form.periodEnd)
    ) {
      return;
    }

    // TODO: Add encodeURI to another fields
    const sI = Array.isArray(form.sickImmunizer) ? form.sickImmunizer.join("|") : form.sickImmunizer;
    const loc = Array.isArray(form.local) ? form.local.join("|") : form.local;
    let request ="?tabBy=" + state.tabBy + "&type=" + form.type + "&granularity=" + form.granularity +
      "&sickImmunizer=" + encodeURIComponent(sI) + "&local=" + loc + "&dose=" + form.dose;

    request += form.periodStart ? "&periodStart=" + form.periodStart : "";
    request += form.periodEnd ? "&periodEnd=" + form.periodEnd : "";

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
      isStateData = "macregNames";
    } else if (granularity === "Região de saúde") {
      isStateData = "regNames";
    } else if (granularity === "Estados") {
      isStateData = "statesNames";
    } else if (granularity === "Nacional") {
      isStateData = "countryName";
    } else {
      isStateData = "citiesNames";
    }

    const [result, localNames] = await Promise.all([
      api.request(`data/${request}`),
      api.request(isStateData)
    ]);

    if (result.error) {
      this.commit(
          "message/ERROR",
          "Não foi possível carregar os dados. Tente novamente mais tarde.",
          { root: true }
      );
      return { result: {}, localNames: {} }
    } else if (!result || result.data && result.data.length <= 1) {
      commit("UPDATE_TITLES", null);
      this.commit(
          "message/WARNING",
          "Não há dados disponíveis para os parâmetros selecionados.",
          { root: true }
      );
      return { result: {}, localNames: {} }
    } else {
      commit("UPDATE_TITLES", result.metadata.titles);
    }

    if (form.type !== "Doses aplicadas") {
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
  async requestPage(
    { state, commit },
    [ mutation, slug ]
  ) {
    const api = new DataFetcher(state.apiUrl);
    const payload = await api.requestSettingApiEndPoint(slug, "/wp-json/wp/v2/pages");
    commit(mutation, payload);
  },
  async requestJson(
    { state, commit },
    [ mutation, endpoint ]
  ) {
    const api = new DataFetcher(state.apiUrl);
    const payload = await api.request(endpoint);
    commit(mutation, payload);
  },
}
