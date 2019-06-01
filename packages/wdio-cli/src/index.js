import yargs from 'yargs'

import { CLI_PARAMS, USAGE } from './config'
import Launcher from './launcher'
import runCLI from './run'

export const run = () => {
    const { showHelp, argv } = yargs
        .usage(USAGE)
        .commandDir('commands')
        .options(CLI_PARAMS)
        .help()

    /**
     * fail execution if more than one wdio config file was specified
     */
    if (argv._.length > 1) {
        showHelp()
        console.error(`More than one config file was specified: ${argv._.join(', ')}`) // eslint-disable-line
        console.error('Error: You can only run one wdio config file!') // eslint-disable-line
        process.exit(1)
    }

    runCLI(argv)
}

export default Launcher
