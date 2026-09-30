import { jest } from '@jest/globals'

const warn = jest.fn()
const error = jest.fn()
const info = jest.fn()

jest.unstable_mockModule('../src/logger.js', () => ({
  default: { warn, error, info, child: () => ({ warn, error, info }) },
}))

// env mutável: o código decide pelo NODE_ENV em tempo de execução.
const envMock = { NODE_ENV: 'test' }
jest.unstable_mockModule('../src/env.js', () => ({ default: envMock }))

const { logarCodigoSimulado } = await import('../src/services/email.js')

beforeEach(() => {
  warn.mockClear()
  error.mockClear()
  info.mockClear()
})

describe('logarCodigoSimulado', () => {
  it('em desenvolvimento loga o código para testar o fluxo sem SMTP', () => {
    envMock.NODE_ENV = 'development'
    const logado = logarCodigoSimulado('verificação', '123456', { userId: 7 })
    expect(logado).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][1]).toContain('123456')
  })

  it('em produção NUNCA escreve o código no log', () => {
    envMock.NODE_ENV = 'production'
    const logado = logarCodigoSimulado('redefinição de senha', '654321', { userId: 7 })
    expect(logado).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][1]).not.toContain('654321')
    expect(JSON.stringify(warn.mock.calls[0][0])).not.toContain('654321')
  })

  it('em teste também não vaza o código', () => {
    envMock.NODE_ENV = 'test'
    const logado = logarCodigoSimulado('verificação', '999999', {})
    expect(logado).toBe(false)
    expect(JSON.stringify(warn.mock.calls[0])).not.toContain('999999')
  })
})
