import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    { ignores: ['dist', 'coverage'] },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                __APP_VERSION__: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        settings: {
            react: { version: 'detect' },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
            'indent': ['error', 4],
            'no-unused-vars': ['error', {
                varsIgnorePattern: '^[A-Z_]',
                argsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
            }],
            'max-lines': ['error', {
                'max': 300,
                'skipBlankLines': true,
                'skipComments': true,
            }],
            'quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true,
            }],
            'template-curly-spacing': ['error', 'never'],
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['react-router-dom'],
                    message: 'Usa "react-router" (sin -dom). El proyecto está en RR v7.',
                }],
            }],
        },
    },
    {
        files: ['**/SummaryStep.jsx', '**/PdfForm.jsx'],
        rules: {
            'max-lines': ['error', {
                'max': 500,
                'skipBlankLines': true,
                'skipComments': true,
            }],
        },
    },
];
