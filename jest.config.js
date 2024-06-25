module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
      '**/test/**/*.test.ts'
  ],
  transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
      '^vscode$': '<rootDir>/src/__mocks__/vscode.js',
  },
};
