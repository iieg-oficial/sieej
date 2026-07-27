import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import CampoConHistorial from '../src/forms/components/CampoConHistorial';

const HISTORIAL = [
    {
        field_path: 'alta_archivos.base_de_datos',
        field_label: 'Base de datos',
        valor_anterior: 'anterior.xlsx',
        valor_nuevo: 'nuevo.xlsx',
        cambiado_en: '2026-07-27T17:13:09Z',
    },
];

const Harness = ({ historial }) => {
    const methods = useForm();
    return (
        <GlobalProvider>
            <CampoConHistorial
                field={{ type: 'text', name: 'base_de_datos', label: 'Base de datos' }}
                fullName="alta_archivos.base_de_datos"
                methods={methods}
                historial={historial}
            />
        </GlobalProvider>
    );
};

const render = async (historial) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(<Harness historial={historial} />);
    });
    return { container, root };
};

const botonHistorial = (container) => container.querySelector(
    'button[aria-label="Ver historial de este campo"]',
);

describe('CampoConHistorial', () => {
    it('muestra el boton con su icono cuando el campo tiene historial', async () => {
        const { container } = await render(HISTORIAL);
        const boton = botonHistorial(container);
        expect(boton).toBeTruthy();
        expect(boton.querySelector('svg')).toBeTruthy();
    });

    it('no muestra el boton cuando el campo no tiene historial', async () => {
        const { container } = await render([]);
        expect(botonHistorial(container)).toBeNull();
    });

    it('despliega el historial del campo al pulsarlo', async () => {
        const { container } = await render(HISTORIAL);
        expect(container.textContent).not.toContain('nuevo.xlsx');
        await act(async () => {
            botonHistorial(container).click();
        });
        expect(container.textContent).toContain('anterior.xlsx');
        expect(container.textContent).toContain('nuevo.xlsx');
    });
});
