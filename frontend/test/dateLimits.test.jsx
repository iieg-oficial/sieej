import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { GlobalProvider } from '../src/context/GlobalContext';
import FieldRenderer from '../src/forms/renderer/FieldRenderer';
import { resolveDateLimit, todayISO } from '../src/helpers/dateFormat';
import { buildDateHints } from '../src/helpers/fieldHints';

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

const abrirCalendario = async (container) => {
    await act(async () => {
        container.querySelector('[role="button"]').click();
    });
};

const diaDeshabilitado = (container, dia) => {
    const boton = [...container.querySelectorAll('button')]
        .find((b) => b.textContent.trim() === String(dia) && b.className.includes('w-9'));
    return boton?.disabled;
};

const flecha = (container, etiqueta) => [...container.querySelectorAll('button')]
    .find((b) => b.getAttribute('aria-label') === etiqueta);

const avisos = (container) => [...container.querySelectorAll('span')]
    .map((s) => s.textContent.trim())
    .filter((t) => t.startsWith('No se aceptan') || t.startsWith('Hasta el') || t.startsWith('Desde el'));

describe('resolveDateLimit', () => {
    it('traduce «hoy» a la fecha del día', () => {
        expect(resolveDateLimit('hoy')).toBe(todayISO());
    });

    it('conserva una fecha ISO fija', () => {
        expect(resolveDateLimit('2020-01-15')).toBe('2020-01-15');
    });

    it('descarta un límite mal formado', () => {
        expect(resolveDateLimit('15/01/2020')).toBeUndefined();
        expect(resolveDateLimit('')).toBeUndefined();
        expect(resolveDateLimit(undefined)).toBeUndefined();
    });
});

describe('calendario con maxDate', () => {
    it('deshabilita los días posteriores a hoy', async () => {
        const hoy = new Date();
        const esUltimoDiaDelMes = new Date(
            hoy.getFullYear(), hoy.getMonth() + 1, 0,
        ).getDate() === hoy.getDate();

        const container = await render({
            type: 'date',
            name: 'fecha_captura',
            label: 'Fecha de captura',
            validation: { maxDate: 'hoy' },
        });
        await abrirCalendario(container);

        expect(diaDeshabilitado(container, hoy.getDate())).toBe(false);
        if (!esUltimoDiaDelMes) {
            expect(diaDeshabilitado(container, hoy.getDate() + 1)).toBe(true);
        }
    });

    it('sin límites deja habilitados los días del mes', async () => {
        const container = await render({
            type: 'date',
            name: 'fecha_libre',
            label: 'Fecha libre',
        });
        await abrirCalendario(container);

        expect(diaDeshabilitado(container, 1)).toBe(false);
    });

    it('bloquea avanzar al mes siguiente y deja retroceder', async () => {
        const container = await render({
            type: 'date',
            name: 'fecha_captura',
            label: 'Fecha de captura',
            validation: { maxDate: 'hoy' },
        });
        await abrirCalendario(container);

        expect(flecha(container, 'Siguiente').disabled).toBe(true);
        expect(flecha(container, 'Anterior').disabled).toBe(false);
    });

    it('muestra el aviso del límite al abrir el calendario', async () => {
        const container = await render({
            type: 'date',
            name: 'fecha_captura',
            label: 'Fecha de captura',
            validation: { maxDate: 'hoy' },
        });
        expect(avisos(container)).toHaveLength(0);

        await abrirCalendario(container);
        expect(avisos(container)).toEqual(['No se aceptan fechas futuras']);
    });
});

describe('buildDateHints', () => {
    const manana = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    };

    it('sin valor el aviso es neutral', () => {
        const [hint] = buildDateHints({ maxDate: 'hoy' });
        expect(hint).toMatchObject({ id: 'maxDate', text: 'No se aceptan fechas futuras', state: 'neutral' });
    });

    it('marca error cuando el valor se pasa del máximo', () => {
        const [hint] = buildDateHints({ maxDate: 'hoy', value: manana() });
        expect(hint.state).toBe('error');
    });

    it('marca ok cuando el valor cumple', () => {
        const [hint] = buildDateHints({ maxDate: 'hoy', value: todayISO() });
        expect(hint.state).toBe('ok');
    });

    it('usa la fecha con formato local en un límite fijo', () => {
        const [hint] = buildDateHints({ minDate: '2020-01-15', value: '2019-12-31' });
        expect(hint).toMatchObject({ id: 'minDate', text: 'Desde el 15/01/2020', state: 'error' });
    });

    it('ignora un límite mal formado', () => {
        expect(buildDateHints({ maxDate: '15/01/2020', value: todayISO() })).toEqual([]);
    });
});
