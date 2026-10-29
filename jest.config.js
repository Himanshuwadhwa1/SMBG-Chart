/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
    '^expo-notifications(/.*)?$': '<rootDir>/__mocks__/expo-notifications.ts',
    '^expo-file-system(/legacy)?$': '<rootDir>/__mocks__/expo-file-system.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native-safe-area-context.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/react-navigation-native.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^test-renderer$': 'react-test-renderer',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
