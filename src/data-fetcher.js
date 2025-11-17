/**
 * @typedef {{
 * signal?: AbortSignal,
 * body?: object,
 * method?: string,
 * headers?: Object.<string, string>
 * }} FetchOptions
 */

/**
 * Utility class for fetching data from an API, formatted for WordPress-style endpoints.
 * @export
 */
export class DataFetcher {
    /**
     * Creates an instance of DataFetcher.
     * @param {string} api - The base URL of the API (e.g., 'https://example.com').
     */
    constructor(api) {
        /** @type {string} */
        this.api = api
    }

    /**
     * Fetches data using a GET request.
     * Designed for simple requests where parameters are in the URL.
     *
     * @async
     * @param {string} endPoint - The specific API endpoint to fetch (e.g., 'posts').
     * @param {string} [apiPoint="/wp-json/api/v1/"] - The API path prefix.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the request.
     * @returns {Promise<{ [key: string]: any, error?: Error, aborted?: boolean }>}
     * an abort object, or an error object.
     */
    async requestData(endPoint, apiPoint = '/wp-json/api/v1/', signal) {
        try {
            const url = this.api + apiPoint + endPoint
            const options = signal ? { signal } : undefined
            const response = await fetch(url, options)

            const data = await response.json()
            return data
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return { aborted: true }
                }
                return { error }
            }
            return { error: new Error(String(error)) }
        }
    }

    // TODO: Maybe we will need to do more complex filters with args in request body
    /**
     * Fetches data with advanced options, allowing for custom methods, headers, and a request body.
     *
     * @async
     * @param {string} endPoint - The specific API endpoint.
     * @param {FetchOptions} [options={}] - Fetch options including signal, body, method, and headers.
     * @param {string} [apiPoint="/wp-json/api/v1/"] - The API path prefix.
     * @returns {Promise<string|{ [key: string]: any, error?: Error, aborted?: boolean }>}
     * This can be a JSON object, raw text, an abort object, or an Error.
     */
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

        /** @type {Object.<string, any>} */
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
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return { aborted: true }
                }
                return error
            }
            return new Error(String(error))
        }
    }

    /**
     * Simplified GET request using the default API path ("/wp-json/api/v1/").
     *
     * @async
     * @param {string} endPoint - The specific API endpoint.
     * @param {AbortSignal} [signal] - An optional AbortSignal.
     * @returns {Promise<{ [key: string]: any, error?: Error, aborted?: boolean }>}
     * @see {@link DataFetcher#requestData}
     */
    async request(endPoint, signal = undefined) {
        const result = await this.requestData(
            endPoint,
            '/wp-json/api/v1/',
            signal
        )
        return result
    }

    /**
     * GET request that allows specifying a custom API path.
     *
     * @async
     * @param {string} endPoint - The specific API endpoint.
     * @param {string} apiEndpoint - The custom API path prefix (e.g., '/wp-json/v2/').
     * @param {AbortSignal} [signal] - An optional AbortSignal.
     * @returns {Promise<{ [key: string]: any, error?: Error, aborted?: boolean }>}
     * @see {@link DataFetcher#requestData}
     */
    async requestSettingApiEndPoint(endPoint, apiEndpoint, signal) {
        const result = await this.requestData(endPoint, apiEndpoint, signal)
        return result
    }
}
