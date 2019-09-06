/**
 *
 * Access an element inside a given element's shadowRoot
 *
 * <example>
    :shadow$$.js
    it('should return an element inside a shadowRoot', () => {
        const innerEl = $('.input').shadow$('#innerEl');
        console.log(innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadow$
 * @param {String|Function} selector  selector or JS Function to fetch a certain element
 * @return {Element}
 * @type utility
 *
 */

import { shadowFnFactory } from '../../scripts/shadowFnFactory'

export default async function shadowRoot (selector) {
    if (this.isReactElement) {
        throw new Error('Shadow root selector cannot be used with element selected via React commands')
    }

    return await this.$(shadowFnFactory(selector))
}
