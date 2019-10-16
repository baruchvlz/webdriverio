import { runFnInFiberContext } from '@wdio/utils/build/shim'
import { getElements } from '../../utils/getElementObject'

async function custom$ (strategyName, strategyArgument) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }
    const res = await this.execute(strategy, strategyArgument)

    return await getElements.call(this, strategy, res)
}

export default runFnInFiberContext(custom$)
