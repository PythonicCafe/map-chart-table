export class DataFetcher {
    constructor(api) {
        this.api = api
    }

    async requestData(endPoint, apiPoint = '/wp-json/api/v1/', signal) {
        try {
            const args = [this.api + apiPoint + endPoint]
            if (signal) {
                args.push({ signal })
            }
            const response = await fetch(...args)
            const data = await response.json()
            return data
        } catch (error) {
            if (error.name === 'AbortError') {
                return { aborted: true }
            }
            return { error }
        }
    }

    // TODO: Mabe we will need to do more complex filters with POST requests with args in request body
    async requestDataInBody(
        endPoint,
        options = {},
        apiPoint = '/wp-json/api/v1/'
    ) {
        const {
            signal,
            body,
            method = 'GET',
            headers: customHeaders = {},
        } = options

        console.log({ api: this.api, apiPoint, endPoint })
        const url = this.api + apiPoint + endPoint

        const fetchOptions = {
            method,
            signal,
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...customHeaders,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        }

        try {
            // Remove keys with undefined values
            Object.keys(fetchOptions).forEach(
                (key) =>
                    fetchOptions[key] === undefined && delete fetchOptions[key]
            )

            const response = await fetch(url, fetchOptions)

            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                return await response.json()
            }

            return response.text()
        } catch (error) {
            console.log(error)
            if (error.name === 'AbortError') {
                return { aborted: true }
            }
            return error
        }
    }

    async request(endPoint, signal = undefined) {
        const args = [endPoint, '/wp-json/api/v1/']
        if (signal) {
            args.push(signal)
        }
        const result = await this.requestData(...args)
        return result
    }

    async requestSettingApiEndPoint(endPoint, apiEndpoint, signal) {
        const args = [endPoint, apiEndpoint]
        if (args) {
            args.push(signal)
        }
        const result = await this.requestData(...args)
        return result
    }
}
