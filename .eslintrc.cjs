/** Minimal ESLint config: no plugins, no TS parser */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['src/**/*.{js,jsx}'],
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off'
      }
    }
  ]
};
