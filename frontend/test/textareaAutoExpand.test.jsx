import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';

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

const enfocar = async (el) => {
    await act(async () => {
        el.focus();
    });
};

const desenfocar = async (el) => {
    await act(async () => {
        el.blur();
    });
};

describe('textarea', () => {
    const field = { type: 'textarea', name: 'observaciones', label: 'Observaciones' };

    it('se despliega al enfocarlo y se contrae al salir', async () => {
        const container = await render(field);
        const textarea = container.querySelector('textarea');

        expect(textarea.rows).toBe(1);

        await enfocar(textarea);
        expect(textarea.rows).toBe(8);

        await desenfocar(textarea);
        expect(textarea.rows).toBe(1);
    });

    it('el botón de contraer gana mientras el campo sigue enfocado', async () => {
        const container = await render(field);
        const textarea = container.querySelector('textarea');
        await enfocar(textarea);

        const boton = container.querySelector('[aria-label="Contraer campo"]');
        expect(boton).not.toBeNull();

        await act(async () => {
            boton.click();
        });
        expect(textarea.rows).toBe(1);
    });

    it('un campo de texto de una línea no se despliega al enfocarlo', async () => {
        const container = await render({ type: 'text', name: 'razon', label: 'Razón' });
        const input = container.querySelector('input');

        await enfocar(input);
        expect(container.querySelector('textarea')).toBeNull();
    });
});
