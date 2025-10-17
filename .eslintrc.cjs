/** Minimal ESLint config (no extra deps) */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.jsx', '**/*.js'],
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off',
      },
    },
  ],
};
