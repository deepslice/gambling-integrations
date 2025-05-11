export default {
  moduleFileExtensions: ['js', 'mjs'],
  moduleNameMapper: {
    '^#app/(.*)': '<rootDir>/src/$1',
  },
  rootDir: './',
  testRegex: '.*\\.spec\\.js$',
  testEnvironment: 'node',
  transform: {},
}
