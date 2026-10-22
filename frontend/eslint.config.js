import base from '@ghegar/eslint-config';
import react from '@ghegar/eslint-config/react';
import reactApp from '@ghegar/eslint-config/react-app';

const lines = (max) => ['error', { max, skipBlankLines: true, skipComments: true }];

export default [
    { ignores: ['public/**'] },
    ...base,
    ...react,
    ...reactApp,
    {
        languageOptions: { globals: { __APP_VERSION__: 'readonly' } },
        settings: { 'jsx-a11y': { components: { Checkbox: 'input', Switch: 'input' } } },
        rules: {
            'react-refresh/only-export-components': ['warn', {
                allowConstantExport: true,
                allowExportNames: ['CatalogosContext', 'FormsContext', 'SubmissionContext', 'WizardContext'],
            }],
            'no-restricted-imports': ['error', { patterns: [
                { group: ['react-router-dom'], message: 'Usa "react-router" (sin -dom).' },
                { group: ['*.png', '**/*.png'], message: 'PNG imports no permitidos. Convierte a WebP (cwebp -lossless) o usa SVG.' },
            ] }],
        },
    },
    { files: ['**/SummaryStep.jsx', '**/PdfForm.jsx'], rules: { 'max-lines': lines(500) } },
    { files: ['**/Modal.jsx'], rules: { 'jsx-a11y/no-noninteractive-element-interactions': 'off' } },
    { files: ['src/main.jsx', 'src/helpers/analytics.js'], rules: { 'no-console': 'off' } },
    { files: ['test/colaboracion.test.jsx'], rules: { 'react-hooks/globals': 'off' } },
];
