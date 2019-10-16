import { runFnInFiberContext } from '@wdio/utils/build/shim'
import { getElements, getElement } from '../../utils/getElementObject'

async function useLocatorStrategy (strategyName, strategyArgument, multiple) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }
    const res = await this.execute(strategy, strategyArgument)

    if (multiple) {
        return await getElements.call(this, strategy, res)
    }

    return await getElement.call(this, strategy, res)
}

export default runFnInFiberContext(useLocatorStrategy)
