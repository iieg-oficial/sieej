import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';

const FIELD = {
    type: 'text',
    name: 'datos.telefono',
    label: 'Teléfono',
    validation: {
        pattern: '^\\d{10}$',
        patternMessage: 'Ingresa un teléfono de 10 dígitos',
        minLength: 10,
        maxLength: 10,
    },
};

const Harness = () => {
    const methods = useForm({ mode: 'onTouched', reValidateMode: 'onChange' });
    return (
        <GlobalProvider>
            <FieldRenderer field={FIELD} methods={methods} />
        </GlobalProvider>
    );
};

const render = async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(<Harness />);
    });
    return container;
};

const setValorNativo = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
).set;

const enfocar = async (container) => {
    const input = container.querySelector('input');
    await act(async () => {
        input.focus();
    });
    return input;
};

const desenfocar = async (container) => {
    const input = container.querySelector('input');
    await act(async () => {
        input.blur();
    });
};

const escribir = async (container, texto) => {
    const input = container.querySelector('input');
    await act(async () => {
        setValorNativo.call(input, texto);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

const pista = (container, texto) => [ ...container.querySelectorAll('span') ]
    .find((span) => span.textContent === texto && !span.getAttribute('role'));

describe('pistas de validación en el campo', () => {
    it('solo describe las reglas mientras se edita el campo', async () => {
        const container = await render();
        expect(pista(container, 'Ingresa un teléfono de 10 dígitos')).toBeUndefined();

        await enfocar(container);
        expect(pista(container, 'Ingresa un teléfono de 10 dígitos').className)
            .toContain('text-[#8E8E8E]');
        expect(pista(container, 'Mínimo 10 caracteres')).toBeTruthy();
        expect(pista(container, '0/10 caracteres')).toBeTruthy();
    });

    it('marca el formato en rojo mientras el dato no cumple', async () => {
        const container = await render();
        await enfocar(container);
        await escribir(container, '333');
        expect(pista(container, 'Ingresa un teléfono de 10 dígitos').className)
            .toContain('text-[#EA4336]');
        expect(pista(container, 'Mínimo 10 caracteres').className)
            .toContain('text-[#EA4336]');
        expect(pista(container, '3/10 caracteres')).toBeTruthy();
    });

    it('marca el formato en verde en cuanto el dato cumple', async () => {
        const container = await render();
        await enfocar(container);
        await escribir(container, '3312345678');
        expect(pista(container, 'Ingresa un teléfono de 10 dígitos').className)
            .toContain('text-[#34A853]');
        expect(pista(container, 'Mínimo 10 caracteres').className)
            .toContain('text-[#34A853]');
        expect(pista(container, '10/10 caracteres').className)
            .toContain('text-[#FF8300]');
    });

    it('deja visible el error de formato cuando el campo pierde el foco', async () => {
        const container = await render();
        await enfocar(container);
        await escribir(container, '33a3333333');
        await desenfocar(container);

        expect(pista(container, 'Ingresa un teléfono de 10 dígitos')).toBeUndefined();
        const alerta = container.querySelector('[role="alert"]');
        expect(alerta).toBeTruthy();
        expect(alerta.textContent).toContain('Ingresa un teléfono de 10 dígitos');
    });
});
