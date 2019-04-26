import http from 'http'
import path from 'path'
import https from 'https'
import merge from 'lodash.merge'
import axios from 'axios'
import EventEmitter from 'events'

import logger from '@wdio/logger'

import { isSuccessfulResponse, getErrorFromResponseBody } from './utils'
import pkg from '../package.json'

const log = logger('webdriver')
const agents = {
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
}

export default class WebDriverRequest extends EventEmitter {
    constructor (method, endpoint, body) {
        super()
        this.body = body
        this.method = method
        this.endpoint = endpoint
        this.requiresSessionId = this.endpoint.match(/:sessionId/)
        this.defaultOptions = {
            method,
            followAllRedirects: true,
            responseType: 'json',
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'User-Agent': 'webdriver/' + pkg.version
            }
        }
    }

    makeRequest (options, sessionId) {
        const fullRequestOptions = merge({}, this.defaultOptions, this._createOptions(options, sessionId))
        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.connectionRetryCount)
    }

    _createOptions (options, sessionId) {
        const requestOptions = {
            agent: options.agent || agents[`${options.protocol}Agent`],
            headers: typeof options.headers === 'object' ? options.headers : {},
            qs: typeof options.queryParams === 'object' ? options.queryParams : {}
        }

        /**
         * only apply body property if existing
         */
        if (this.body && (Object.keys(this.body).length || this.method === 'POST')) {
            requestOptions.data = this.body
            requestOptions.headers = merge({}, requestOptions.headers, {
                'Content-Length': Buffer.byteLength(JSON.stringify(requestOptions.data), 'UTF-8')
            })
        }

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (this.requiresSessionId && !sessionId) {
            throw new Error('A sessionId is required for this command')
        }

        requestOptions.url = `${options.protocol}://${options.hostname}:${options.port}` +
            path.join(options.path, this.endpoint.replace(':sessionId', sessionId))

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.user && options.key) {
            requestOptions.auth = {
                username: options.user,
                password: options.key
            }
        }

        /**
         * if the environment variable "STRICT_SSL" is defined as "false", it doesn't require SSL certificates to be valid.
         */
        requestOptions.strictSSL = !(process.env.STRICT_SSL === 'false' || process.env.strict_ssl === 'false')

        return requestOptions
    }

    async _request (fullRequestOptions, totalRetryCount = 0, retryCount = 0) {
        log.info(`[${fullRequestOptions.method}] ${fullRequestOptions.url}`)

        if (fullRequestOptions.body && Object.keys(fullRequestOptions.body).length) {
            log.info('DATA', fullRequestOptions.body)
        }

        let response
        try {
            response = await axios(fullRequestOptions)

            if (isSuccessfulResponse(response.status, response.data)) {
                this.emit('response', { result: response.data })

                return response.data
            }

            return Promise.reject()
        } catch (err) {
            const error = err || getErrorFromResponseBody(response.data)

            if(error.name === 'stale element reference') {
                log.warn('Request encountered a stale element - terminating request')
                this.emit('response', { error })
                return error
            }

            if (retryCount >= totalRetryCount || error.message.includes('invalid session id')) {
                log.error('Request failed due to', error)
                this.emit('response', { error })
                return error
            }

            ++retryCount
            this.emit('retry', { error, retryCount })
            log.warn('Request failed due to', error.message)
            log.info(`Retrying ${retryCount}/${totalRetryCount}`)
            await this._request(fullRequestOptions, totalRetryCount, retryCount)
        }
    }
}
