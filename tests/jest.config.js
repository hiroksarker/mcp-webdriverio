export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  verbose: true,
  rootDir: '.',
  modulePaths: ['<rootDir>/../src']
}; 