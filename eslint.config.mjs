import js from '@eslint/js';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.d.mts'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'error',
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-implicit-coercion': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
];
