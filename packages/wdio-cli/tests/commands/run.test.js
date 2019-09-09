import fs from 'fs'
import Launcher from './../../src/launcher'
import Watcher from './../../src/watcher'
import * as runCmd from './../../src/commands/run'
import * as utils from './../../src/utils'

jest.mock('./../../src/launcher', () => class LauncherMock {
    run() {
        return {
            then: jest.fn().mockReturnValue({ catch: jest.fn().mockReturnValue('launcher-mock') }),
        }
    }
})
jest.mock('./../../src/watcher', () => class WatcherMock {
    watch() {
        return 'watching-test'
    }
})

describe('Command: run', () => {
    beforeAll(() => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
        jest.spyOn(utils, 'missingConfigurationPrompt').mockImplementation(() => {})
        jest.spyOn(console, 'error')
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => false)
        await runCmd.handler({ configPath: 'foo/bar' })

        expect(utils.missingConfigurationPrompt).toHaveBeenCalled()
        expect(utils.missingConfigurationPrompt)
            .toHaveBeenCalledWith('run', 'No WebdriverIO configuration found in "foo/bar"')

        fs.existsSync.mockClear()
    })

    it('should use Watcher if "--watch" flag is passed', async () => {
        const watcher = await runCmd.handler({ configPath: 'foo/bar', watch: true })

        expect(watcher).toBe('watching-test')
    })

    it('should call launch if stdin isTTY = true', async () => {
        process.stdin.isTTY = true

        const result = await runCmd.handler({ configPath: 'foo/bar' })

        expect(result).toBe('launcher-mock')
    })

    afterAll(() => {
        console.error.mockClear()
        fs.existsSync.mockClear()
        utils.missingConfigurationPrompt.mockClear()
        Launcher.mockClear()
        Watcher.mockClear()
    })
})