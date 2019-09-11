import Fiber from '../src/fibers'

import executeHooksWithArgs from '../src/executeHooksWithArgs'

const hookError = new Error('oops')
const hook1 = jest.fn().mockImplementation(
    (...args) => new Promise(
        (resolve) => setTimeout(
            () => resolve(args.join('_')), 50)))
const hook2 = jest.fn().mockImplementation(() => { throw hookError })
const hook3 = jest.fn().mockReturnValue('3_2_1')
const hook4 = jest.fn().mockReturnValue(Promise.reject(hookError))

beforeEach(() => {
    hook1.mockClear()
    hook2.mockClear()
    hook3.mockClear()
    hook4.mockClear()
    Fiber.mockClear()
})

test('runs all hooks', async () => {
    const result = await executeHooksWithArgs(
        [hook1, hook2, hook3, hook4],
        [1, 2, 3]
    )

    expect(result).toEqual(['1_2_3', hookError, '3_2_1', hookError])
    expect(Fiber).toBeCalledTimes(4)
})

test('allows execution with single hook and argument', async () => {
    const result = await executeHooksWithArgs(hook1, 'foobar')
    expect(result).toEqual(['foobar'])
    expect(Fiber).toBeCalledTimes(1)
})
