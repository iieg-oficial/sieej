import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';

const CAMBIO = { step_id: 'datos', field_name: 'ente', tipo: 'modificado' };

const render = async (field, { cambioField, defaultValues } = {}) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const Harness = () => {
        const methods = useForm({
            defaultValues,
            mode: 'onTouched',
            reValidateMode: 'onChange',
        });
        return (
            <GlobalProvider>
                <FieldRenderer field={field} methods={methods} cambioField={cambioField} />
            </GlobalProvider>
        );
    };
    await act(async () => {
        createRoot(container).render(<Harness />);
    });
    return container;
};

const limpiar = async (container) => {
    const boton = [ ...container.querySelectorAll('button') ]
        .find((b) => b.getAttribute('aria-label')?.startsWith('Limpiar'));
    await act(async () => {
        boton.click();
    });
    return boton;
};

describe('acciones sobre los campos', () => {
    it('no vuelca el distintivo de cambio dentro del placeholder', async () => {
        const container = await render(
            { type: 'text', name: 'datos.ente', label: 'Nombre del ente de gobierno' },
            { cambioField: CAMBIO },
        );
        const input = container.querySelector('input');
        expect(input.placeholder).toBe('Nombre del ente de gobierno');
        expect(container.textContent).toContain('Cambió');
    });

    it('renderiza un area de texto real para los campos de texto largo', async () => {
        const container = await render({
            type: 'textarea', name: 'datos.notas', label: 'Notas',
        });
        expect(container.querySelector('textarea')).toBeTruthy();
        expect(container.querySelector('input')).toBeNull();
    });

    it('deja el campo de texto sin respuesta al limpiarlo', async () => {
        const container = await render(
            { type: 'text', name: 'datos.ente', label: 'Ente' },
            { defaultValues: { datos: { ente: 'IIEG' } } },
        );
        expect(container.querySelector('input').value).toBe('IIEG');
        await limpiar(container);
        expect(container.querySelector('input').value).toBe('');
    });

    it('avisa que el campo es obligatorio en cuanto se limpia', async () => {
        const container = await render(
            { type: 'text', name: 'datos.ente', label: 'Ente', required: true },
            { defaultValues: { datos: { ente: 'IIEG' } } },
        );
        await limpiar(container);
        expect(container.querySelector('[role="alert"]').textContent)
            .toContain('Este campo es obligatorio');
    });

    it('quita la respuesta de un radio al volver a elegir la opcion activa', async () => {
        const container = await render(
            {
                type: 'radio',
                name: 'datos.obligado',
                label: '¿Es sujeto obligado?',
                options: [
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                ],
            },
            { defaultValues: { datos: { obligado: 'si' } } },
        );
        const [ si ] = container.querySelectorAll('input[type="radio"]');
        expect(si.checked).toBe(true);
        await act(async () => {
            si.click();
        });
        expect(si.checked).toBe(false);
    });
});
