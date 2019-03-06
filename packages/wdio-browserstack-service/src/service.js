import logger from '@wdio/logger'
import got from 'got'

import { BROWSER_DESCRIPTION } from './constants'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService {
    constructor (config) {
        this.config = config
        this.failures = 0
    }

    before() {
        this.sessionId = global.browser.sessionId
        this.auth = {
            user: this.config.user || 'NotSetUser',
            pass: this.config.key || 'NotSetKey'
        }

        return this._printSessionURL()
    }

    afterSuite(suite) {
        if (suite.hasOwnProperty('error')) {
            this.failures++
        }
    }

    afterTest(test) {
        if (!test.passed) {
            this.failures++
        }
    }

    afterStep(feature) {
        if (
            /**
             * Cucumber v1
             */
            feature.failureException ||
            /**
             * Cucumber v2
             */
            (typeof feature.getFailureException === 'function' && feature.getFailureException()) ||
            /**
             * Cucumber v3, v4
             */
            (feature.status === 'failed')
        ) {
            ++this.failures
        }
    }

    after() {
        return this._update(this.sessionId, this._getBody())
    }

    async onReload(oldSessionId, newSessionId) {
        this.sessionId = newSessionId
        await this._update(oldSessionId, this._getBody())
        this.failures = 0
        this._printSessionURL()
    }

    _update(sessionId, requestBody) {
        const authStr = this.auth ? `${this.auth.user}:${this.auth.pass}` : ''

        return got(`https://api.browserstack.com/automate/sessions/${sessionId}.json`, {
            method: 'PUT',
            body: JSON.stringify(requestBody),
            headers: {
                authorization: `Basic ${Buffer.from(authStr).toString('base64')}`
            }
        })
            .then(res => res.json())
    }

    _getBody() {
        return {
            status: this.failures === 0 ? 'completed' : 'error'
        }
    }

    _printSessionURL() {
        const capabilities = global.browser.capabilities
        const authStr = this.auth ? `${this.auth.user}:${this.auth.pass}` : ''

        return got(`https://api.browserstack.com/automate/sessions/${this.sessionId}.json`, {
            headers: {
                authorization: `Basic ${Buffer.from(authStr).toString('base64')}`
            }
        })
            .then((res) => {
                if (res.status !== 200) {
                    return Promise.reject(new Error(`Bad response code: Expected (200), Received (${res.status})!`))
                }
                return res.json()
            })
            .then((json) => {
                const browserString = BROWSER_DESCRIPTION
                    .map(k => capabilities[k])
                    .filter(v => !!v)
                    .join(' ')


                log.info(`${browserString} session: ${json.automation_session.browser_url}`)

                return json
            })
    }
}
