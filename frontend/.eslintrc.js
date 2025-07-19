module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: 'tsconfig.json',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    // Основные правила
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off', // отключаем в пользу TypeScript варианта
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/react-in-jsx-scope': 'off', // не нужно в React 17+
    'react/prop-types': 'off', // используем TypeScript вместо PropTypes
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    '.eslintrc.js',
    'vite.config.ts',
    'vitest.config.ts',
  ],
}; 