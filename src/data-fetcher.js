export class DataFetcher {
  constructor(api = "https://main--cool-stroopwafel-fba5ba.netlify.app/.netlify/functions/api/") {
    this.api = api;
  }

  async requestData(endPoint) {
    const self = this;
    try {
      const response = await fetch(self.api + endPoint);
      const data = await response.json();
      return data;
    } catch (error) {
      // Do Nothing
    }
  }

  async request(endPoint) {
    const self = this;
    const result = await self.requestData(endPoint);
    return result;
  }

  async requestState(endPoint) {
    const self = this;
    const result = await self.requestData("UF/" + endPoint);
    return result;
  }

}

