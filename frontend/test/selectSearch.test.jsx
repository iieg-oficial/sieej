import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';
import { SEARCH_MIN_OPTIONS, filterOptions, shouldSearch } from '../src/helpers/selectSearch';

const opciones = (total) => Array.from({ length: total }, (_, i) => ({
    value: `m${i + 1}`,
    label: `Municipio ${i + 1}`,
}));

const Harness = ({ field }) => {
    const methods = useForm({ mode: 'onTouched', reValidateMode: 'onChange' });
    return (
        <GlobalProvider>
            <FieldRenderer field={field} methods={methods} />
        </GlobalProvider>
    );
};

const render = async (field) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(<Harness field={field} />);
    });
    return container;
};

const setValorNativo = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
).set;

const abrirDropdown = async (container) => {
    await act(async () => {
        container.querySelector('[role="combobox"]').click();
    });
};

const escribir = async (input, texto) => {
    await act(async () => {
        setValorNativo.call(input, texto);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

const buscador = (container) => container.querySelector('input[type="text"]');

const dropdown = (container) => container.querySelector('[role="listbox"], .absolute');

const etiquetasVisibles = (container) => [...container.querySelectorAll('[role="option"]')]
    .map((o) => o.textContent.trim());

describe('filterOptions', () => {
    it('filtra sin distinguir mayúsculas ni espacios sobrantes', () => {
        const out = filterOptions(opciones(10), '  municipio 1 ');
        expect(out.map((o) => o.value)).toEqual(['m1', 'm10']);
    });

    it('devuelve todo con búsqueda vacía', () => {
        expect(filterOptions(opciones(3), '')).toHaveLength(3);
    });

    it('activa la búsqueda a partir del umbral', () => {
        expect(shouldSearch(opciones(SEARCH_MIN_OPTIONS - 1))).toBe(false);
        expect(shouldSearch(opciones(SEARCH_MIN_OPTIONS))).toBe(true);
    });
});

describe('select con catálogo largo', () => {
    const field = (type) => ({
        type,
        name: 'municipio',
        label: 'Municipio',
        options: opciones(12),
    });

    it('el buscador vive en el control, no como fila del desplegable', async () => {
        const container = await render(field('select'));
        const input = buscador(container);

        expect(input).not.toBeNull();
        expect(dropdown(container)?.contains(input)).not.toBe(true);
    });

    it('filtra conforme se escribe', async () => {
        const container = await render(field('select'));
        await abrirDropdown(container);

        const input = buscador(container);
        expect(etiquetasVisibles(container)).toHaveLength(12);

        await escribir(input, 'Municipio 11');
        expect(etiquetasVisibles(container)).toEqual(['Municipio 11']);

        await escribir(input, 'Zapopan');
        expect(etiquetasVisibles(container)).toHaveLength(0);
        expect(container.textContent).toContain('No se encontraron opciones');
    });

    it('al elegir sobrescribe el texto y conserva la lista completa', async () => {
        const container = await render(field('select'));
        await abrirDropdown(container);

        await escribir(buscador(container), 'municipio 7');
        const opcion = [...container.querySelectorAll('[role="option"]')][0];
        await act(async () => {
            opcion.click();
        });

        expect(buscador(container).value).toBe('Municipio 7');

        await abrirDropdown(container);
        expect(buscador(container).value).toBe('');
        expect(buscador(container).placeholder).toBe('Municipio 7');
        expect(etiquetasVisibles(container)).toHaveLength(12);
        const marcada = [...container.querySelectorAll('[role="option"]')]
            .find((o) => o.getAttribute('aria-selected') === 'true');
        expect(marcada.textContent.trim()).toBe('Municipio 7');
    });

    it('no muestra el buscador con pocas opciones', async () => {
        const container = await render({ ...field('select'), options: opciones(3) });
        await abrirDropdown(container);

        expect(buscador(container)).toBeNull();
        expect(etiquetasVisibles(container)).toHaveLength(3);
    });

    it('también filtra en selección múltiple', async () => {
        const container = await render(field('select_multiple'));
        await abrirDropdown(container);

        const input = buscador(container);
        expect(input).not.toBeNull();

        await escribir(input, 'municipio 4');
        const etiquetas = [...container.querySelectorAll('label[for^="municipio-"]')]
            .map((l) => l.textContent.trim());
        expect(etiquetas).toEqual(['Municipio 4']);
    });
});
