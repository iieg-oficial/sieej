import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';

const Harness = () => {
    const methods = useForm();
    return (
        <GlobalProvider>
            <FieldRenderer
                field={{
                    type: 'date_range',
                    name: 'general.periodo',
                    label: 'Periodo del levantamiento',
                    required: true,
                }}
                methods={methods}
            />
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
    return { container, root };
};

describe('FieldRenderer date_range', () => {
    it('renderiza etiqueta general y los dos triggers de fecha', async () => {
        const { container, root } = await render();

        const triggers = container.querySelectorAll('[role="button"][aria-haspopup="dialog"]');
        expect(triggers.length).toBe(2);
        expect(triggers[0].id).toBe('general.periodo.start');
        expect(triggers[1].id).toBe('general.periodo.end');
        expect(container.textContent).toContain('Periodo del levantamiento');
        expect(container.textContent).toContain('Fecha inicial');
        expect(container.textContent).toContain('Fecha final');

        await act(async () => { root.unmount(); });
        container.remove();
    });

    it('abre el calendario custom al hacer clic en un trigger', async () => {
        const { container, root } = await render();

        expect(container.querySelector('[role="dialog"]')).toBeNull();

        const trigger = container.querySelector('[role="button"][aria-haspopup="dialog"]');
        await act(async () => {
            trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        const calendar = container.querySelector('[role="dialog"]');
        expect(calendar).not.toBeNull();
        expect(container.querySelectorAll('.grid-cols-7 button').length).toBeGreaterThan(0);

        await act(async () => { root.unmount(); });
        container.remove();
    });

    it('muestra el selector de meses al hacer clic en el mes del encabezado', async () => {
        const { container, root } = await render();

        const trigger = container.querySelector('[role="button"][aria-haspopup="dialog"]');
        await act(async () => {
            trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        const dialog = container.querySelector('[role="dialog"]');
        const monthButton = [...dialog.querySelectorAll('button')]
            .find((b) => /^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)$/.test(b.textContent));
        expect(monthButton).toBeDefined();

        await act(async () => {
            monthButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        const shortMonths = [...dialog.querySelectorAll('.grid-cols-3 button')].map((b) => b.textContent);
        expect(shortMonths).toContain('Ene');
        expect(shortMonths).toContain('Dic');
        expect(shortMonths.length).toBe(12);

        await act(async () => { root.unmount(); });
        container.remove();
    });
});
