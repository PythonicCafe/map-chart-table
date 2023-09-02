export class DataFetcher {
  constructor(api) {
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

}

