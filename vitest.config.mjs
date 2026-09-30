export default {
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['frontend/**', 'node_modules/**'],
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      APP_ENV: 'test',
      JWT_SECRET: 'sail_marinex_super_secure_jwt_secret_key_change_in_prod_2026_min_32_chars',
    },
  },
};
