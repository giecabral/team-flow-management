export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  // Resolve .js imports to actual .ts source files (NodeNext requires .js extensions)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'bundler',
      },
    }],
  },
  injectGlobals: true,
  setupFiles: ['./src/test/env.ts'],
  testMatch: ['**/src/**/*.test.ts'],
  clearMocks: true,
};
