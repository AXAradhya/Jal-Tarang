export default {
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['frontend/**', 'node_modules/**'],
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
};
