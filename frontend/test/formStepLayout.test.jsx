import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import FormStep from '../src/forms/renderer/FormStep';

const campo = (name, colSpan, col, extra = {}) => ({
    name,
    label: name.toUpperCase(),
    type: 'text',
    layout: {
        colSpan,
        ...(col != null ? { col, ...(col === 1 ? { newRow: true } : {}) } : {}),
        ...extra,
    },
});

const Wrapper = ({ step }) => {
    const methods = useForm({ defaultValues: { [step.id]: {} } });
    return <FormStep step={step} methods={methods} catalogos={{}} />;
};

const render = (step) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => { createRoot(container).render(<Wrapper step={step} />); });
    return container;
};

const celdaDe = (container, name) => {
    const input = container.querySelector(`[name="paso.${name}"]`);
    const grid = container.querySelector('.grid');
    return [...grid.children].find((el) => el.contains(input));
};

const clasesDe = (container, name) => celdaDe(container, name)?.className ?? '';

describe('FormStep aplica el acomodo de la definicion', () => {
    it('traduce el ancho a columnas del grid', () => {
        const container = render({
            id: 'paso',
            type: 'form',
            fields: [campo('completo', 1), campo('mitad', 2), campo('tercio', 3)],
        });

        expect(clasesDe(container, 'completo')).toContain('md:col-span-6');
        expect(clasesDe(container, 'mitad')).toContain('md:col-span-3');
        expect(clasesDe(container, 'tercio')).toContain('md:col-span-2');
    });

    it('coloca el campo en la columna que pide la definicion', () => {
        const container = render({
            id: 'paso',
            type: 'form',
            fields: [campo('izq', 3, 1), campo('der', 3, 5)],
        });

        expect(clasesDe(container, 'izq')).toContain('md:col-start-1');
        expect(clasesDe(container, 'der')).toContain('md:col-start-5');
    });

    it('rellena los huecos para que la linea reservada no se comparta', () => {
        const container = render({
            id: 'paso',
            type: 'form',
            fields: [campo('a', 3, 1), campo('b', 3, 3, { alone: true })],
        });

        const rellenos = [...container.querySelectorAll('[aria-hidden]')]
            .filter((el) => el.className.includes('md:col-span'));

        expect(rellenos.length).toBeGreaterThan(0);
        expect(clasesDe(container, 'b')).toContain('md:col-start-3');
    });

    it('respeta la marca de linea aunque la columna quepa a la derecha', () => {
        const container = render({
            id: 'paso',
            type: 'form',
            fields: [campo('a', 3, 1), campo('b', 3, 3, { newRow: true })],
        });

        const hijos = [...container.querySelector('.grid').children];
        const posDe = (name) => hijos.findIndex(
            (el) => el.querySelector(`[name="paso.${name}"]`),
        );

        expect(posDe('a')).toBeGreaterThanOrEqual(0);
        expect(posDe('b')).toBeGreaterThan(posDe('a') + 1);
    });
});
