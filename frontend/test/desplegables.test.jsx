import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';

const opciones = (total) => Array.from({ length: total }, (_, i) => ({
    value: `m${i + 1}`,
    label: `Municipio ${i + 1}`,
}));

const Harness = ({ field }) => {
    const methods = useForm({ mode: 'onTouched', reValidateMode: 'onChange' });
    return (
        <GlobalProvider>
            <FieldRenderer field={field} methods={methods} />
            <p>afuera</p>
        </GlobalProvider>
    );
};

const montados = [];

const render = async (field) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    montados.push({ root, container });
    await act(async () => {
        root.render(<Harness field={field} />);
    });
    return container;
};

const abrir = async (container) => {
    await act(async () => {
        container.querySelector('[role="combobox"]').click();
    });
};

const presionar = async (elemento, pointerId = 1) => {
    await act(async () => {
        elemento.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId }));
        elemento.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId }));
    });
};

const escape = async () => {
    await act(async () => {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
};

const abierto = (container) => container.querySelector('[role="combobox"]').getAttribute('aria-expanded') === 'true';

const afuera = (container) => [...container.querySelectorAll('p')].find((p) => p.textContent === 'afuera');

afterEach(() => {
    montados.splice(0).forEach(({ root, container }) => {
        act(() => root.unmount());
        container.remove();
    });
});

describe.each(['select', 'select_multiple'])('desplegable %s', (type) => {
    const field = { type, name: 'municipio', label: 'Municipio', options: opciones(3) };

    it('se cierra con un clic fuera y no con uno dentro', async () => {
        const container = await render(field);
        await abrir(container);
        expect(abierto(container)).toBe(true);
        await presionar(container.querySelector('[role="combobox"]'));
        expect(abierto(container)).toBe(true);
        await presionar(afuera(container));
        expect(abierto(container)).toBe(false);
    });

    it('no se cierra si la presión empieza dentro y termina fuera', async () => {
        const container = await render(field);
        await abrir(container);
        await act(async () => {
            container.querySelector('[role="combobox"]')
                .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 2 }));
            afuera(container).dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 2 }));
        });
        expect(abierto(container)).toBe(true);
    });

    it('se cierra con Esc', async () => {
        const container = await render(field);
        await abrir(container);
        await escape();
        expect(abierto(container)).toBe(false);
    });
});
