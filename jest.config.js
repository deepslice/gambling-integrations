export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  rootDir: './',
  testRegex: '.*\\.spec\\.js$',
  transform: {},
  testEnvironment: 'node',
}
