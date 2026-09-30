export default {
  transform: {},
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/logger.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
}
