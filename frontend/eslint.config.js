import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
    { ignores: ['dist', 'coverage', 'public/**'] },
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
            'jsx-a11y': {
                components: {
                    Checkbox: 'input',
                    Switch: 'input',
                },
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.flatConfigs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/exhaustive-deps': 'warn',
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
                { allowConstantExport: true, allowExportNames: ['CatalogosContext', 'FormsContext', 'SubmissionContext', 'WizardContext'] },
            ],
            'no-restricted-imports': ['error', {
                patterns: [
                    {
                        group: ['react-router-dom'],
                        message: 'Usa "react-router" (sin -dom). El proyecto está en RR v7.',
                    },
                    {
                        group: ['*.png', '**/*.png'],
                        message: 'PNG imports no permitidos. Convierte a WebP (cwebp -lossless) o usa SVG.',
                    },
                ],
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
    {
        files: ['**/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ['**/Modal.jsx'],
        rules: {
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
        },
    },
];
