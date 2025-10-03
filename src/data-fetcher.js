export class DataFetcher {
  constructor(api) {
    this.api = api;
  }

 async requestData(endPoint, apiPoint = "/wp-json/api/v1/", signal) {
    try {
      const args = [this.api + apiPoint + endPoint];
      if (signal) {
        args.push({ signal });
      }
      const response = await fetch(...args);
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        return { aborted: true };
      }
      return { error };
    }
  }

  async request(endPoint) {
    const result = await this.requestData(endPoint);
    return result;
  }

  async request(endPoint, signal) {
    const args = [endPoint, "/wp-json/api/v1/"];
    if (signal) {
      args.push(signal);
    }
    const result = await this.requestData(...args);
    return result;
  }

  async requestSettingApiEndPoint(endPoint, apiEndpoint, signal) {
    const args = [endPoint, apiEndpoint];
    if (args) {
      args.push(signal);
    }
    const result = await this.requestData(...args);
    return result;
  }
}

