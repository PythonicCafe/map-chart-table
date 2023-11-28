export class DataFetcher {
  constructor(api) {
    this.api = api;
  }

  async requestData(endPoint, apiPoint = "/wp-json/api/v1/") {
    const self = this;

    try {
      const response = await fetch(self.api + apiPoint + endPoint);
      const data = await response.json();
      return data;
    } catch (error) {
      return { error }
    }
  }

  async request(endPoint) {
    const result = await this.requestData(endPoint);
    return result;
  }

  async requestSettingApiEndPoint(endPoint, apiEndpoint) {
    const result = await this.requestData(endPoint, apiEndpoint);
    return result;
  }
}

